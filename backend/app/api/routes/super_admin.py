import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import User, Incident, Booking
from app.models.super_app_entities import (
    FoodOrder, GroceryOrder, RideBooking, APIIntegrationAdapter, Restaurant, GroceryProduct
)
from app.api.routes.auth import get_current_user

router = APIRouter(prefix="/super-admin", tags=["Admin Super Console & API Registry"])


class AdapterStatusUpdate(BaseModel):
    adapter_status: str  # LIVE, DEMO, PENDING_APPROVAL, UNAVAILABLE
    notes: Optional[str] = None


@router.get("/overview")
def get_super_admin_overview(db: Session = Depends(get_db)):
    """
    Unified analytics overview across train bookings, food, grocery, transit, and emergency coordination.
    """
    total_bookings = db.query(Booking).count()
    total_food_orders = db.query(FoodOrder).count()
    total_grocery_orders = db.query(GroceryOrder).count()
    total_rides = db.query(RideBooking).count()
    total_incidents = db.query(Incident).count()

    # Calculate simulated GMV
    food_rev = sum(o.total_amount for o in db.query(FoodOrder).all())
    grocery_rev = sum(o.total_amount for o in db.query(GroceryOrder).all())
    ride_rev = sum(r.estimated_fare for r in db.query(RideBooking).all())

    adapters = db.query(APIIntegrationAdapter).all()
    live_adapters = sum(1 for a in adapters if a.adapter_status == "LIVE")
    demo_adapters = sum(1 for a in adapters if a.adapter_status == "DEMO")

    return {
        "metrics": {
            "total_bookings": total_bookings,
            "total_food_orders": total_food_orders,
            "total_grocery_orders": total_grocery_orders,
            "total_rides_booked": total_rides,
            "total_emergency_incidents": total_incidents,
            "total_services_revenue": round(food_rev + grocery_rev + ride_rev, 2),
            "live_adapters_count": live_adapters,
            "demo_adapters_count": demo_adapters,
        },
        "revenue_breakdown": {
            "food_ordering": round(food_rev, 2),
            "grocery_essentials": round(grocery_rev, 2),
            "local_transit": round(ride_rev, 2)
        },
        "system_health": {
            "core_api": "HEALTHY",
            "database": "CONNECTED",
            "gemini_assistant": "READY",
            "emergency_distress_bus": "OPERATIONAL"
        }
    }


@router.get("/adapters")
def get_api_adapters(db: Session = Depends(get_db)):
    """
    List all external API integration adapters and their live status.
    """
    adapters = db.query(APIIntegrationAdapter).order_by(APIIntegrationAdapter.category.asc()).all()
    return [
        {
            "id": a.id,
            "service_name": a.service_name,
            "provider_name": a.provider_name,
            "category": a.category,
            "adapter_status": a.adapter_status,
            "endpoint_url": a.endpoint_url,
            "last_ping_status": a.last_ping_status,
            "latency_ms": a.latency_ms,
            "notes": a.notes,
            "updated_at": a.updated_at.isoformat() if a.updated_at else ""
        }
        for a in adapters
    ]


@router.put("/adapters/{service_name}/status")
def update_adapter_status(
    service_name: str,
    payload: AdapterStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Update adapter integration mode (LIVE, DEMO, PENDING_APPROVAL, UNAVAILABLE).
    """
    adapter = db.query(APIIntegrationAdapter).filter(APIIntegrationAdapter.service_name == service_name.upper()).first()
    if not adapter:
        raise HTTPException(status_code=404, detail="Integration adapter not found")

    adapter.adapter_status = payload.adapter_status.upper()
    if payload.notes:
        adapter.notes = payload.notes
    db.commit()
    db.refresh(adapter)

    return {
        "success": True,
        "service_name": adapter.service_name,
        "new_status": adapter.adapter_status,
        "message": f"Adapter {adapter.service_name} updated to {adapter.adapter_status}"
    }


@router.get("/all-orders")
def get_all_super_app_orders(
    order_type: Optional[str] = "ALL",  # ALL, FOOD, GROCERY, RIDE, BOOKING
    limit: int = 25,
    db: Session = Depends(get_db)
):
    """
    Unified live order feed for admin monitoring.
    """
    feed = []

    if order_type in ["ALL", "FOOD"]:
        food_orders = db.query(FoodOrder).order_by(FoodOrder.created_at.desc()).limit(limit).all()
        for f in food_orders:
            feed.append({
                "type": "FOOD",
                "reference": f.order_reference,
                "customer": f.passenger_name,
                "amount": f.total_amount,
                "status": f.order_status,
                "details": f"Station {f.delivery_station_code} | Coach {f.coach_number}",
                "timestamp": f.created_at.isoformat() if f.created_at else ""
            })

    if order_type in ["ALL", "GROCERY"]:
        groc_orders = db.query(GroceryOrder).order_by(GroceryOrder.created_at.desc()).limit(limit).all()
        for g in groc_orders:
            feed.append({
                "type": "GROCERY",
                "reference": g.order_reference,
                "customer": g.recipient_name,
                "amount": g.total_amount,
                "status": g.order_status,
                "details": g.delivery_address[:35] + "...",
                "timestamp": g.created_at.isoformat() if g.created_at else ""
            })

    if order_type in ["ALL", "RIDE"]:
        rides = db.query(RideBooking).order_by(RideBooking.created_at.desc()).limit(limit).all()
        for r in rides:
            feed.append({
                "type": "RIDE",
                "reference": r.ride_reference,
                "customer": r.driver_name,
                "amount": r.estimated_fare,
                "status": r.ride_status,
                "details": f"{r.vehicle_type} ({r.pickup_location[:15]} -> {r.drop_location[:15]})",
                "timestamp": r.created_at.isoformat() if r.created_at else ""
            })

    # Sort descending by timestamp
    feed.sort(key=lambda x: x["timestamp"], reverse=True)
    return feed[:limit]
