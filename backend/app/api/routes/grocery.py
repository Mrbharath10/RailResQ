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
from app.models.super_app_entities import GroceryProduct, GroceryOrder
from app.api.routes.auth import get_current_user

router = APIRouter(prefix="/grocery", tags=["Grocery & Essentials"])


class GroceryOrderItemPayload(BaseModel):
    product_id: int
    name: str
    price: float
    quantity: int
    unit: Optional[str] = "1 unit"


class GroceryOrderCreatePayload(BaseModel):
    recipient_name: str
    recipient_phone: str
    delivery_address: str
    delivery_station_code: Optional[str] = ""
    items: List[GroceryOrderItemPayload]
    payment_method: Optional[str] = "UPI_SIMULATED"


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    """
    List distinct grocery and travel essential categories.
    """
    cats = db.query(GroceryProduct.category).distinct().all()
    categories = [c[0] for c in cats if c[0]]
    if not categories:
        categories = [
            "Travel Essentials", "Snacks & Munchies", "Cold Drinks & Juices",
            "Fruits & Fresh", "Dairy & Bread", "Packaged Food",
            "Personal Care", "Stationery & Electronics"
        ]
    return categories


@router.get("/products")
def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get all grocery products with optional category and search filters.
    """
    query = db.query(GroceryProduct).filter(GroceryProduct.in_stock == True)

    if category and category.upper() != "ALL":
        query = query.filter(GroceryProduct.category.ilike(f"%{category.strip()}%"))

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                GroceryProduct.name.ilike(term),
                GroceryProduct.description.ilike(term),
                GroceryProduct.brand.ilike(term)
            )
        )

    products = query.order_by(GroceryProduct.id.asc()).all()

    return [
        {
            "id": p.id,
            "name": p.name,
            "category": p.category,
            "description": p.description,
            "price": p.price,
            "unit": p.unit,
            "brand": p.brand,
            "image_url": p.image_url,
            "discount_pct": p.discount_pct,
            "in_stock": p.in_stock
        }
        for p in products
    ]


@router.post("/orders")
def place_grocery_order(
    payload: GroceryOrderCreatePayload,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Place a simulated 15-minute grocery order to station, platform, or local stay.
    """
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cannot place empty grocery order")

    subtotal = sum(it.price * it.quantity for it in payload.items)
    delivery_fee = 25.0 if subtotal < 299 else 0.0
    total = round(subtotal + delivery_fee, 2)

    order_ref = f"RR-GROC-{random.randint(100000, 999999)}"

    order = GroceryOrder(
        order_reference=order_ref,
        user_id=current_user.id if current_user else None,
        delivery_station_code=payload.delivery_station_code.upper() if payload.delivery_station_code else "",
        delivery_address=payload.delivery_address,
        recipient_name=payload.recipient_name,
        recipient_phone=payload.recipient_phone,
        items_json=json.dumps([it.dict() for it in payload.items]),
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total_amount=total,
        order_status="PACKING",
        payment_method=payload.payment_method or "UPI_SIMULATED",
        payment_status="PAID",
        estimated_delivery_mins=15,
        is_simulated=True
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    return {
        "success": True,
        "order_reference": order.order_reference,
        "recipient_name": order.recipient_name,
        "delivery_address": order.delivery_address,
        "total_amount": order.total_amount,
        "order_status": order.order_status,
        "estimated_delivery_mins": order.estimated_delivery_mins,
        "message": "Instant 15-min simulated delivery confirmed via RailResQ Quick Supermarket."
    }


@router.get("/orders/my-orders")
def get_my_grocery_orders(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Retrieve passenger's grocery order history.
    """
    user_id = current_user.id if current_user else None
    query = db.query(GroceryOrder)
    if user_id:
        query = query.filter(GroceryOrder.user_id == user_id)
    else:
        query = query.limit(10)

    orders = query.order_by(GroceryOrder.created_at.desc()).all()

    return [
        {
            "order_reference": o.order_reference,
            "recipient_name": o.recipient_name,
            "delivery_address": o.delivery_address,
            "delivery_station_code": o.delivery_station_code,
            "items": json.loads(o.items_json or "[]"),
            "total_amount": o.total_amount,
            "order_status": o.order_status,
            "estimated_delivery_mins": o.estimated_delivery_mins,
            "created_at": o.created_at.isoformat() if o.created_at else ""
        }
        for o in orders
    ]


@router.get("/orders/{order_ref}/track")
def track_grocery_order(order_ref: str, db: Session = Depends(get_db)):
    """
    Live grocery order status tracking.
    """
    order = db.query(GroceryOrder).filter(GroceryOrder.order_reference == order_ref).first()
    if not order:
        raise HTTPException(status_code=404, detail="Grocery order not found")

    return {
        "order_reference": order.order_reference,
        "recipient_name": order.recipient_name,
        "delivery_address": order.delivery_address,
        "order_status": order.order_status,
        "total_amount": order.total_amount,
        "items": json.loads(order.items_json or "[]"),
        "steps": [
            {"step": "Order Received & Payment Confirmed", "completed": True, "time": "0 mins ago"},
            {"step": "Dark Store Packing Items", "completed": True, "time": "Packing now"},
            {"step": "Delivery Rider Picked Up", "completed": order.order_status in ["OUT_FOR_DELIVERY", "DELIVERED"], "time": "In 6 mins"},
            {"step": "Delivered to Passenger", "completed": order.order_status == "DELIVERED", "time": "In 15 mins"}
        ]
    }
