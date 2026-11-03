import json
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.models.entities import Station, User
from app.models.booking_entities import (
    TrainCatalog,
    SeatInventory,
    Booking,
    BookingPassenger,
    PaymentRecord
)
from app.services.booking_engine import booking_engine
from app.core.security import get_current_user_optional, get_current_user

router = APIRouter(prefix="/booking", tags=["Railway Ticket Booking & PNR Engine"])


# ==========================================
# Pydantic Schemas
# ==========================================

class PassengerInput(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    age: int = Field(..., ge=1, le=120)
    gender: str = Field("Male", description="Male, Female, Other")
    berth_preference: str = Field("No Preference")
    concession_type: Optional[str] = "NONE"


class FareQuoteRequest(BaseModel):
    train_number: str
    travel_class: str
    passenger_count: int = 1
    journey_date: str


class InitiateBookingRequest(BaseModel):
    train_number: str
    journey_date: str
    travel_class: str
    passengers: List[PassengerInput]
    payment_method: str = "UPI"
    simulate_failure: bool = False
    contact_email: Optional[str] = "passenger@railresq.gov.in"
    contact_phone: Optional[str] = "+91 98401 23456"


class CancelBookingRequest(BaseModel):
    reason: Optional[str] = "Passenger cancellation"


class AdminInventoryUpdate(BaseModel):
    train_number: str
    journey_date: str
    travel_class: str
    available_seats: int
    fare_amount: float


# ==========================================
# 1. Station & Train Search Endpoints
# ==========================================

@router.get("/stations", summary="List All Booking-Enabled Railway Stations")
def get_booking_stations(db: Session = Depends(get_db)):
    """Returns all stations available for train search, origin and destination."""
    stations = db.query(Station).filter(Station.is_active == True).all()
    return [
        {
            "code": s.station_code,
            "name": s.station_name,
            "division": s.division,
            "latitude": s.latitude,
            "longitude": s.longitude
        }
        for s in stations
    ]


@router.get("/trains/search", summary="Search Trains Between Stations with Live Availability")
def search_trains(
    source: str = Query("MAS", description="Source station code (e.g. MAS, SBC, NDLS)"),
    destination: str = Query("SBC", description="Destination station code (e.g. SBC, MAS, CBE)"),
    date: str = Query(..., description="Journey date in YYYY-MM-DD format"),
    travel_class: Optional[str] = Query("ALL", description="Filter class or ALL"),
    db: Session = Depends(get_db)
):
    """
    Finds direct and route-connected trains between source and destination stations.
    Returns real-time seat inventory, timings, durations, and fares by class.
    """
    clean_src = source.strip().upper()
    clean_dest = destination.strip().upper()
    
    results = booking_engine.search_trains(
        db,
        source_code=clean_src,
        dest_code=clean_dest,
        journey_date=date,
        travel_class=travel_class
    )
    return {
        "success": True,
        "count": len(results),
        "source": clean_src,
        "destination": clean_dest,
        "date": date,
        "trains": results,
        "disclaimer": "SIMULATED RAILWAY DATA - For RailResQ Academic Decision Support Only."
    }


@router.get("/trains/{train_number}/availability", summary="Get Live Seat Availability by Class")
def get_train_availability(
    train_number: str,
    date: str = Query(..., description="Journey date YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    """Returns class-wise seat inventory for a train on a given date."""
    train = db.query(TrainCatalog).filter(TrainCatalog.train_number == train_number).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train not found in catalog")

    classes = json.loads(train.available_classes or "[]")
    inventories = db.query(SeatInventory).filter(
        SeatInventory.train_number == train_number,
        SeatInventory.journey_date == date
    ).all()

    inv_map = {inv.travel_class: inv for inv in inventories}
    class_results = []

    for cls in classes:
        inv = inv_map.get(cls)
        if inv:
            class_results.append({
                "class": cls,
                "available_seats": inv.available_seats,
                "booked_seats": inv.booked_seats,
                "rac_seats": inv.rac_seats,
                "status": f"AVAILABLE-{inv.available_seats}" if inv.available_seats > 0 else f"RAC-{inv.rac_seats}",
                "fare": inv.fare_amount
            })

    return {
        "train_number": train.train_number,
        "train_name": train.train_name,
        "journey_date": date,
        "availability": class_results
    }


# ==========================================
# 2. Fare Calculation & Booking Initiation
# ==========================================

@router.post("/fare-quote", summary="Server-Side Live Fare Breakdown Calculation")
def get_fare_quote(
    payload: FareQuoteRequest,
    db: Session = Depends(get_db)
):
    """Calculates official server-side fare breakdown including base fare, reservation charges, and GST."""
    train = db.query(TrainCatalog).filter(TrainCatalog.train_number == payload.train_number).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")

    inv = db.query(SeatInventory).filter(
        SeatInventory.train_number == payload.train_number,
        SeatInventory.journey_date == payload.journey_date,
        SeatInventory.travel_class == payload.travel_class
    ).first()

    base_rate = inv.fare_amount if inv else train.base_fare_3a
    breakdown = booking_engine.calculate_fare(
        base_rate=base_rate,
        travel_class=payload.travel_class,
        passenger_count=payload.passenger_count,
        distance_km=train.distance_km
    )

    return {
        "success": True,
        "train_number": train.train_number,
        "train_name": train.train_name,
        "travel_class": payload.travel_class,
        "passenger_count": payload.passenger_count,
        "fare_breakdown": breakdown
    }


@router.post("/initiate", summary="Transactional Seat Allocation & Demo Ticket Generation")
def initiate_booking(
    payload: InitiateBookingRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Executes complete transactional booking:
    1. Validates seat availability inside DB transaction
    2. Deducts seat inventory atomically
    3. Allocates realistic coaches and berths
    4. Issues unique 10-digit Demo PNR and booking reference
    5. Records simulated payment
    """
    try:
        user_id = current_user.id if current_user else None
        passengers_data = [p.model_dump() for p in payload.passengers]

        result = booking_engine.create_booking(
            db=db,
            user_id=user_id,
            train_number=payload.train_number,
            journey_date=payload.journey_date,
            travel_class=payload.travel_class,
            passengers_data=passengers_data,
            payment_method=payload.payment_method,
            simulate_payment_failure=payload.simulate_failure,
            contact_email=payload.contact_email or (current_user.email if current_user else ""),
            contact_phone=payload.contact_phone or ""
        )

        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Booking initiation failed: {str(e)}")


# ==========================================
# 3. Passenger Bookings, Tickets & Cancellation
# ==========================================

@router.get("/my-bookings", summary="Get Passenger's Complete Booking History")
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Returns upcoming, completed, and cancelled demo bookings for the passenger.
    If guest/evaluator, returns recent demo bookings.
    """
    query = db.query(Booking)
    if current_user and current_user.role == "passenger":
        query = query.filter(or_(Booking.user_id == current_user.id, Booking.user_id == None))
    
    bookings = query.order_by(Booking.id.desc()).limit(30).all()
    today_str = datetime.date.today().isoformat()

    upcoming = []
    past = []
    cancelled = []

    for b in bookings:
        item = {
            "id": b.id,
            "demo_pnr": b.demo_pnr,
            "booking_reference": b.booking_reference,
            "train_number": b.train_number,
            "train_name": b.train_name,
            "source": f"{b.source_station_name} ({b.source_station_code})",
            "source_code": b.source_station_code,
            "destination": f"{b.destination_station_name} ({b.destination_station_code})",
            "destination_code": b.destination_station_code,
            "journey_date": b.journey_date,
            "departure_time": b.departure_time,
            "arrival_time": b.arrival_time,
            "travel_class": b.travel_class,
            "passenger_count": b.passenger_count,
            "total_fare": b.total_fare,
            "booking_status": b.booking_status,
            "payment_status": b.payment_status,
            "is_cancelled": b.is_cancelled,
            "created_at": b.created_at.isoformat() if b.created_at else None,
            "passengers": [
                {
                    "name": p.passenger_name,
                    "coach": p.allocated_coach,
                    "berth": p.allocated_berth,
                    "type": p.allocated_berth_type,
                    "status": p.ticket_status
                }
                for p in b.passengers
            ]
        }

        if b.is_cancelled:
            cancelled.append(item)
        elif b.journey_date >= today_str:
            upcoming.append(item)
        else:
            past.append(item)

    return {
        "total_bookings": len(bookings),
        "upcoming": upcoming,
        "past": past,
        "cancelled": cancelled
    }


@router.get("/ticket/{pnr}", summary="Generate Digital Demo Ticket with QR Code Reference")
def get_digital_ticket(pnr: str, db: Session = Depends(get_db)):
    """
    Returns full digital demo ticket payload containing Demo PNR, coach & berths,
    fare breakdown, and official simulated travel disclaimer.
    """
    clean_pnr = pnr.strip()
    booking = db.query(Booking).filter(Booking.demo_pnr == clean_pnr).first()
    if not booking:
        raise HTTPException(status_code=404, detail=f"No ticket found for Demo PNR {clean_pnr}")

    return {
        "demo_pnr": booking.demo_pnr,
        "booking_reference": booking.booking_reference,
        "train_number": booking.train_number,
        "train_name": booking.train_name,
        "source_station": booking.source_station_name,
        "source_station_code": booking.source_station_code,
        "destination_station": booking.destination_station_name,
        "destination_station_code": booking.destination_station_code,
        "journey_date": booking.journey_date,
        "departure_time": booking.departure_time,
        "arrival_time": booking.arrival_time,
        "travel_class": booking.travel_class,
        "quota": booking.quota,
        "booking_status": booking.booking_status,
        "payment_status": booking.payment_status,
        "payment_method": booking.payment_method,
        "transaction_id": booking.transaction_id,
        "fare_breakdown": {
            "base_fare": booking.base_fare,
            "reservation_charge": booking.reservation_charge,
            "superfast_charge": booking.superfast_charge,
            "gst_amount": booking.gst_amount,
            "total_fare": booking.total_fare
        },
        "passengers": [
            {
                "id": p.id,
                "name": p.passenger_name,
                "age": p.age,
                "gender": p.gender,
                "coach": p.allocated_coach,
                "berth": p.allocated_berth,
                "berth_type": p.allocated_berth_type,
                "status": p.ticket_status
            }
            for p in booking.passengers
        ],
        "is_cancelled": booking.is_cancelled,
        "refund_amount": booking.refund_amount,
        "qr_code_data": f"RAILRESQ|PNR:{booking.demo_pnr}|TRAIN:{booking.train_number}|DATE:{booking.journey_date}|CLASS:{booking.travel_class}|STATUS:{booking.booking_status}",
        "disclaimer": "DEMO TICKET - NOT VALID FOR ACTUAL RAILWAY TRAVEL.",
        "issued_at": booking.created_at.isoformat() if booking.created_at else None
    }


@router.post("/cancel/{pnr}", summary="Cancel Ticket & Calculate Simulated Refund")
def cancel_ticket(
    pnr: str,
    payload: CancelBookingRequest,
    db: Session = Depends(get_db)
):
    """
    Cancels a confirmed demo booking, deducts cancellation fee,
    calculates simulated refund, and releases seats back to inventory.
    """
    try:
        result = booking_engine.cancel_booking(
            db=db,
            pnr=pnr.strip(),
            reason=payload.reason or "Passenger cancellation"
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))


# ==========================================
# 4. PNR Verification & Emergency Integration
# ==========================================

@router.get("/pnr/verify/{pnr}", summary="Verify 10-Digit Demo PNR & Cross-Link with Emergency System")
def verify_demo_pnr(pnr: str, db: Session = Depends(get_db)):
    """
    Verifies 10-digit demo PNR against booking database.
    Integrates directly with RailResQ emergency incident reporting.
    """
    result = booking_engine.verify_pnr(db, pnr.strip())
    if not result.get("verified"):
        raise HTTPException(status_code=404, detail=result.get("message"))
    return result


# ==========================================
# 5. Admin Booking & Inventory Management
# ==========================================

@router.get("/admin/overview", summary="Admin Booking Analytics & Revenue Metrics")
def get_admin_booking_overview(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Admin analytics dashboard: Total bookings, simulated revenue,
    cancellations, seat occupancy, and recent booking log.
    """
    total_bookings = db.query(Booking).count()
    confirmed_bookings = db.query(Booking).filter(Booking.booking_status == "CONFIRMED").count()
    cancelled_bookings = db.query(Booking).filter(Booking.booking_status == "CANCELLED").count()

    total_revenue = db.query(func.sum(Booking.total_fare)).filter(Booking.payment_status == "PAID").scalar() or 0.0
    total_refunds = db.query(func.sum(Booking.refund_amount)).scalar() or 0.0

    recent_bookings = db.query(Booking).order_by(Booking.id.desc()).limit(15).all()

    # Train popularity
    train_counts = (
        db.query(Booking.train_name, Booking.train_number, func.count(Booking.id).label("count"))
        .group_by(Booking.train_name, Booking.train_number)
        .order_by(func.count(Booking.id).desc())
        .limit(6)
        .all()
    )

    return {
        "metrics": {
            "total_bookings": total_bookings,
            "confirmed_bookings": confirmed_bookings,
            "cancelled_bookings": cancelled_bookings,
            "cancellation_rate_percent": round((cancelled_bookings / max(1, total_bookings)) * 100, 1),
            "simulated_gross_revenue": round(total_revenue, 2),
            "simulated_refunds_processed": round(total_refunds, 2),
            "net_revenue": round(total_revenue - total_refunds, 2)
        },
        "top_trains": [
            {"train_name": t[0], "train_number": t[1], "bookings": t[2]}
            for t in train_counts
        ],
        "recent_bookings": [
            {
                "pnr": b.demo_pnr,
                "train": f"#{b.train_number} - {b.train_name}",
                "route": f"{b.source_station_code} → {b.destination_station_code}",
                "date": b.journey_date,
                "class": b.travel_class,
                "passengers": b.passenger_count,
                "fare": b.total_fare,
                "status": b.booking_status
            }
            for b in recent_bookings
        ]
    }


@router.post("/admin/inventory", summary="Admin Seat Inventory & Fare Adjustment")
def update_seat_inventory(
    payload: AdminInventoryUpdate,
    db: Session = Depends(get_db)
):
    """Allows administrators to manually adjust seat inventory quotas and fares."""
    inv = db.query(SeatInventory).filter(
        SeatInventory.train_number == payload.train_number,
        SeatInventory.journey_date == payload.journey_date,
        SeatInventory.travel_class == payload.travel_class
    ).first()

    if not inv:
        inv = SeatInventory(
            train_number=payload.train_number,
            journey_date=payload.journey_date,
            travel_class=payload.travel_class,
            total_quota=payload.available_seats + 10,
            available_seats=payload.available_seats,
            booked_seats=10,
            fare_amount=payload.fare_amount
        )
        db.add(inv)
    else:
        inv.available_seats = payload.available_seats
        inv.fare_amount = payload.fare_amount

    db.commit()
    return {
        "success": True,
        "message": f"Inventory updated for #{payload.train_number} on {payload.journey_date} ({payload.travel_class})",
        "available_seats": inv.available_seats,
        "fare_amount": inv.fare_amount
    }
