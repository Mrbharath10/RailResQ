import random
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import User
from app.models.super_app_entities import TransportVehicle, RideBooking
from app.api.routes.auth import get_current_user

router = APIRouter(prefix="/transport", tags=["Local Transportation (Rapido / Auto / Cabs)"])


class FareQuoteRequest(BaseModel):
    pickup_location: str
    drop_location: str
    distance_km: Optional[float] = None
    station_code: Optional[str] = "MAS"


class BookRideRequest(BaseModel):
    vehicle_type: str  # BIKE_TAXI, AUTO, MINI_CAB, SEDAN, SUV
    pickup_location: str
    drop_location: str
    distance_km: float
    estimated_fare: float
    pickup_lat: Optional[float] = 13.0827
    pickup_lng: Optional[float] = 80.2707
    drop_lat: Optional[float] = 13.0405
    drop_lng: Optional[float] = 80.2337
    payment_method: Optional[str] = "UPI_SIMULATED"


@router.get("/vehicles")
def get_available_vehicles(
    station: Optional[str] = None,
    city: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get vehicle options available near station or city with dynamic ETA and fares.
    """
    query = db.query(TransportVehicle).filter(TransportVehicle.is_available == True)

    if station and station.upper() != "ALL":
        query = query.filter(TransportVehicle.station_code == station.upper())

    vehicles = query.all()
    if not vehicles:
        # Fallback to all vehicles
        vehicles = db.query(TransportVehicle).all()

    return [
        {
            "id": v.id,
            "vehicle_type": v.vehicle_type,
            "name": v.name,
            "city": v.city,
            "station_code": v.station_code,
            "base_fare": v.base_fare,
            "per_km_rate": v.per_km_rate,
            "eta_mins": v.eta_mins,
            "capacity_passengers": v.capacity_passengers,
            "icon_name": v.icon_name,
            "is_available": v.is_available
        }
        for v in vehicles
    ]


@router.post("/quote")
def get_fare_quotes(req: FareQuoteRequest, db: Session = Depends(get_db)):
    """
    Compute real-time fare estimates for all vehicle types for a given trip.
    """
    dist = req.distance_km if req.distance_km and req.distance_km > 0 else round(random.uniform(3.5, 12.0), 1)

    vehicles = db.query(TransportVehicle).filter(TransportVehicle.is_available == True).all()
    quotes = []

    for v in vehicles:
        fare = round(v.base_fare + (dist * v.per_km_rate), 0)
        duration_mins = max(8, int(dist * 2.5 + random.randint(2, 6)))
        quotes.append({
            "vehicle_type": v.vehicle_type,
            "name": v.name,
            "estimated_fare": fare,
            "eta_mins": v.eta_mins,
            "duration_mins": duration_mins,
            "distance_km": dist,
            "capacity": v.capacity_passengers,
            "pickup_location": req.pickup_location,
            "drop_location": req.drop_location
        })

    return {
        "pickup": req.pickup_location,
        "drop": req.drop_location,
        "distance_km": dist,
        "quotes": quotes
    }


@router.post("/book")
def book_ride(
    req: BookRideRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Simulated ride confirmation with driver details, OTP, and tracking.
    """
    ride_ref = f"RR-RIDE-{random.randint(100000, 999999)}"
    otp = f"{random.randint(1000, 9999)}"

    # Realistic mock drivers
    driver_pool = [
        {"name": "Murugan S.", "phone": "+91 98401 99887", "rating": 4.9, "reg": "TN-01-AB-4521"},
        {"name": "Karthik R.", "phone": "+91 94442 33120", "rating": 4.8, "reg": "TN-02-CD-8910"},
        {"name": "Suresh Kumar", "phone": "+91 97908 65432", "rating": 4.7, "reg": "TN-09-XY-2345"},
        {"name": "Venkatesh P.", "phone": "+91 99620 11456", "rating": 4.9, "reg": "TN-10-EF-6789"},
    ]
    driver = random.choice(driver_pool)

    booking = RideBooking(
        ride_reference=ride_ref,
        user_id=current_user.id if current_user else None,
        vehicle_type=req.vehicle_type,
        pickup_location=req.pickup_location,
        pickup_lat=req.pickup_lat or 13.0827,
        pickup_lng=req.pickup_lng or 80.2707,
        drop_location=req.drop_location,
        drop_lat=req.drop_lat or 13.0405,
        drop_lng=req.drop_lng or 80.2337,
        distance_km=req.distance_km,
        estimated_duration_mins=int(req.distance_km * 3),
        estimated_fare=req.estimated_fare,
        driver_name=driver["name"],
        driver_phone=driver["phone"],
        vehicle_number=driver["reg"],
        otp_code=otp,
        ride_status="DRIVER_ASSIGNED",
        payment_method=req.payment_method or "UPI_SIMULATED",
        is_simulated=True
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    return {
        "success": True,
        "ride_reference": booking.ride_reference,
        "otp_code": booking.otp_code,
        "driver_name": booking.driver_name,
        "driver_phone": booking.driver_phone,
        "vehicle_number": booking.vehicle_number,
        "vehicle_type": booking.vehicle_type,
        "estimated_fare": booking.estimated_fare,
        "estimated_duration_mins": booking.estimated_duration_mins,
        "ride_status": booking.ride_status,
        "pickup_location": booking.pickup_location,
        "drop_location": booking.drop_location,
        "message": "Ride Confirmed! Share the 4-digit OTP with your driver upon arrival."
    }


@router.get("/rides/my-rides")
def get_my_rides(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Retrieve passenger's ride history.
    """
    user_id = current_user.id if current_user else None
    query = db.query(RideBooking)
    if user_id:
        query = query.filter(RideBooking.user_id == user_id)
    else:
        query = query.limit(10)

    rides = query.order_by(RideBooking.created_at.desc()).all()

    return [
        {
            "ride_reference": r.ride_reference,
            "vehicle_type": r.vehicle_type,
            "pickup_location": r.pickup_location,
            "drop_location": r.drop_location,
            "distance_km": r.distance_km,
            "estimated_fare": r.estimated_fare,
            "driver_name": r.driver_name,
            "vehicle_number": r.vehicle_number,
            "otp_code": r.otp_code,
            "ride_status": r.ride_status,
            "created_at": r.created_at.isoformat() if r.created_at else ""
        }
        for r in rides
    ]


@router.get("/rides/{ride_ref}")
def get_ride_details(ride_ref: str, db: Session = Depends(get_db)):
    """
    Track single ride status.
    """
    ride = db.query(RideBooking).filter(RideBooking.ride_reference == ride_ref).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    return {
        "ride_reference": ride.ride_reference,
        "vehicle_type": ride.vehicle_type,
        "driver_name": ride.driver_name,
        "driver_phone": ride.driver_phone,
        "vehicle_number": ride.vehicle_number,
        "otp_code": ride.otp_code,
        "pickup_location": ride.pickup_location,
        "drop_location": ride.drop_location,
        "distance_km": ride.distance_km,
        "estimated_fare": ride.estimated_fare,
        "ride_status": ride.ride_status,
        "pickup_lat": ride.pickup_lat,
        "pickup_lng": ride.pickup_lng,
        "drop_lat": ride.drop_lat,
        "drop_lng": ride.drop_lng
    }
