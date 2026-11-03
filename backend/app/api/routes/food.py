import json
import random
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.session import get_db
from app.models.entities import User
from app.models.super_app_entities import Restaurant, FoodItem, FoodOrder
from app.api.routes.auth import get_current_user

router = APIRouter(prefix="/food", tags=["Food & Restaurants"])


class FoodOrderItemPayload(BaseModel):
    item_id: int
    name: str
    price: float
    quantity: int
    is_veg: bool = True


class FoodOrderCreatePayload(BaseModel):
    restaurant_id: int
    delivery_station_code: str
    train_number: Optional[str] = ""
    coach_number: Optional[str] = ""
    seat_berth: Optional[str] = ""
    passenger_name: str
    passenger_phone: str
    delivery_address: Optional[str] = ""
    items: List[FoodOrderItemPayload]
    payment_method: Optional[str] = "UPI_SIMULATED"


@router.get("/restaurants")
def get_restaurants(
    station: Optional[str] = None,
    city: Optional[str] = None,
    veg_only: Optional[bool] = False,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Discover restaurants near railway station, destination, or city.
    """
    query = db.query(Restaurant).filter(Restaurant.is_active == True)

    if station and station.upper() != "ALL":
        query = query.filter(Restaurant.station_code == station.upper())

    if city and city.strip():
        query = query.filter(Restaurant.city.ilike(f"%{city.strip()}%"))

    if veg_only:
        query = query.filter(Restaurant.is_veg_only == True)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Restaurant.name.ilike(term),
                Restaurant.cuisine_type.ilike(term),
                Restaurant.city.ilike(term)
            )
        )

    restaurants = query.order_by(Restaurant.rating.desc()).all()

    return [
        {
            "id": r.id,
            "name": r.name,
            "station_code": r.station_code,
            "city": r.city,
            "cuisine_type": r.cuisine_type,
            "rating": r.rating,
            "delivery_time_mins": r.delivery_time_mins,
            "min_order_amount": r.min_order_amount,
            "price_for_two": r.price_for_two,
            "address": r.address,
            "image_url": r.image_url,
            "is_veg_only": r.is_veg_only,
            "operating_hours": r.operating_hours,
            "phone_number": r.phone_number,
            "items_count": len(r.food_items)
        }
        for r in restaurants
    ]


@router.get("/restaurants/{restaurant_id}")
def get_restaurant_detail(restaurant_id: int, db: Session = Depends(get_db)):
    """
    Get full restaurant menu and details.
    """
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id, Restaurant.is_active == True).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    items = db.query(FoodItem).filter(FoodItem.restaurant_id == restaurant_id, FoodItem.is_available == True).all()

    # Group by category
    categories_dict = {}
    for it in items:
        cat = it.category or "Main Course"
        if cat not in categories_dict:
            categories_dict[cat] = []
        categories_dict[cat].append({
            "id": it.id,
            "name": it.name,
            "description": it.description,
            "price": it.price,
            "category": it.category,
            "is_veg": it.is_veg,
            "image_url": it.image_url,
            "spice_level": it.spice_level
        })

    return {
        "id": r.id,
        "name": r.name,
        "station_code": r.station_code,
        "city": r.city,
        "cuisine_type": r.cuisine_type,
        "rating": r.rating,
        "delivery_time_mins": r.delivery_time_mins,
        "min_order_amount": r.min_order_amount,
        "price_for_two": r.price_for_two,
        "address": r.address,
        "image_url": r.image_url,
        "is_veg_only": r.is_veg_only,
        "operating_hours": r.operating_hours,
        "phone_number": r.phone_number,
        "categories": categories_dict,
        "disclaimer": "Simulated partner restaurant menu powered by RailResQ Food Hub."
    }


@router.post("/orders")
def place_food_order(
    payload: FoodOrderCreatePayload,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Places a simulated food order with berth or station delivery.
    """
    restaurant = db.query(Restaurant).filter(Restaurant.id == payload.restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    if not payload.items:
        raise HTTPException(status_code=400, detail="Cannot place order with empty cart")

    subtotal = sum(it.price * it.quantity for it in payload.items)
    delivery_fee = 30.0
    gst = round(subtotal * 0.05, 2)
    grand_total = round(subtotal + delivery_fee + gst, 2)

    order_ref = f"RR-FOOD-{random.randint(100000, 999999)}"

    order = FoodOrder(
        order_reference=order_ref,
        user_id=current_user.id if current_user else None,
        restaurant_id=restaurant.id,
        delivery_station_code=payload.delivery_station_code.upper(),
        train_number=payload.train_number or "",
        coach_number=payload.coach_number or "",
        seat_berth=payload.seat_berth or "",
        passenger_name=payload.passenger_name,
        passenger_phone=payload.passenger_phone,
        delivery_address=payload.delivery_address or f"Train {payload.train_number}, Coach {payload.coach_number}, Seat {payload.seat_berth}",
        items_json=json.dumps([it.dict() for it in payload.items]),
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        gst_amount=gst,
        total_amount=grand_total,
        order_status="PREPARING",
        payment_method=payload.payment_method or "UPI_SIMULATED",
        payment_status="PAID",
        estimated_delivery_time=f"{restaurant.delivery_time_mins} Mins",
        is_simulated=True
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    return {
        "success": True,
        "order_reference": order.order_reference,
        "restaurant_name": restaurant.name,
        "station_code": order.delivery_station_code,
        "coach_berth": f"{order.coach_number} / {order.seat_berth}" if order.coach_number else "Station Concourse",
        "total_amount": order.total_amount,
        "order_status": order.order_status,
        "estimated_delivery_time": order.estimated_delivery_time,
        "message": "Demo Food Order Confirmed! Prepared for train arrival delivery."
    }


@router.get("/orders/my-orders")
def get_my_food_orders(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Retrieve passenger's food order history.
    """
    user_id = current_user.id if current_user else None
    query = db.query(FoodOrder)
    if user_id:
        query = query.filter(FoodOrder.user_id == user_id)
    else:
        query = query.limit(10)

    orders = query.order_by(FoodOrder.created_at.desc()).all()

    results = []
    for o in orders:
        rest = db.query(Restaurant).filter(Restaurant.id == o.restaurant_id).first()
        results.append({
            "order_reference": o.order_reference,
            "restaurant_name": rest.name if rest else "Station Eatery",
            "station_code": o.delivery_station_code,
            "train_coach": f"Train {o.train_number} ({o.coach_number}-{o.seat_berth})" if o.train_number else "Station Delivery",
            "items": json.loads(o.items_json or "[]"),
            "total_amount": o.total_amount,
            "order_status": o.order_status,
            "created_at": o.created_at.isoformat() if o.created_at else "",
            "estimated_delivery_time": o.estimated_delivery_time
        })
    return results


@router.get("/orders/{order_ref}/track")
def track_food_order(order_ref: str, db: Session = Depends(get_db)):
    """
    Live food order status tracking.
    """
    order = db.query(FoodOrder).filter(FoodOrder.order_reference == order_ref).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    rest = db.query(Restaurant).filter(Restaurant.id == order.restaurant_id).first()

    return {
        "order_reference": order.order_reference,
        "restaurant_name": rest.name if rest else "Station Eatery",
        "order_status": order.order_status,
        "passenger_name": order.passenger_name,
        "delivery_target": f"Station {order.delivery_station_code} (Coach {order.coach_number}, Seat {order.seat_berth})",
        "total_amount": order.total_amount,
        "items": json.loads(order.items_json or "[]"),
        "steps": [
            {"step": "Order Received", "completed": True, "time": "Just now"},
            {"step": "Restaurant Preparing Food", "completed": True, "time": "In progress"},
            {"step": "Station Delivery Agent Dispatched", "completed": order.order_status in ["OUT_FOR_DELIVERY", "DELIVERED"], "time": "Pending"},
            {"step": "Delivered at Coach Door", "completed": order.order_status == "DELIVERED", "time": "Pending"}
        ]
    }
