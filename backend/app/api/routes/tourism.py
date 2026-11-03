from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.session import get_db
from app.models.entities import User
from app.models.super_app_entities import TouristPlace, SavedWishlistPlace
from app.api.routes.auth import get_current_user

router = APIRouter(prefix="/tourism", tags=["AI Tourist Discovery & Attractions"])


class WishlistTogglePayload(BaseModel):
    place_id: int
    notes: Optional[str] = ""


@router.get("/cities")
def get_tourist_cities(db: Session = Depends(get_db)):
    """
    Get list of available cities with tourist place counts.
    """
    places = db.query(TouristPlace).all()
    city_map = {}
    for p in places:
        c = p.city
        if c not in city_map:
            city_map[c] = {"city": c, "count": 0, "state": p.state}
        city_map[c]["count"] += 1

    return list(city_map.values())


@router.get("/places")
def get_tourist_places(
    city: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """
    Discover tourist places filtered by city, category, or search term.
    Categories: ATTRACTION, RELIGIOUS, NATURE_RECREATION, FOOD_DINING, SHOPPING, TRAVEL_FACILITY
    """
    query = db.query(TouristPlace)

    if city and city.strip() and city.upper() != "ALL":
        query = query.filter(TouristPlace.city.ilike(f"%{city.strip()}%"))

    if category and category.strip() and category.upper() != "ALL":
        query = query.filter(TouristPlace.category == category.strip().upper())

    if featured is not None:
        query = query.filter(TouristPlace.is_featured == featured)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                TouristPlace.name.ilike(term),
                TouristPlace.description.ilike(term),
                TouristPlace.city.ilike(term),
                TouristPlace.sub_category.ilike(term)
            )
        )

    places = query.order_by(TouristPlace.rating.desc()).all()

    return [
        {
            "id": p.id,
            "name": p.name,
            "city": p.city,
            "state": p.state,
            "category": p.category,
            "sub_category": p.sub_category,
            "description": p.description,
            "image_url": p.image_url,
            "address": p.address,
            "latitude": p.latitude,
            "longitude": p.longitude,
            "rating": p.rating,
            "reviews_count": p.reviews_count,
            "opening_hours": p.opening_hours,
            "entry_fee": p.entry_fee,
            "best_time_to_visit": p.best_time_to_visit,
            "nearby_station_code": p.nearby_station_code,
            "distance_from_station_km": p.distance_from_station_km,
            "is_featured": p.is_featured
        }
        for p in places
    ]


@router.get("/places/{place_id}")
def get_place_detail(place_id: int, db: Session = Depends(get_db)):
    """
    Get full tourist place details.
    """
    p = db.query(TouristPlace).filter(TouristPlace.id == place_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Tourist place not found")

    return {
        "id": p.id,
        "name": p.name,
        "city": p.city,
        "state": p.state,
        "category": p.category,
        "sub_category": p.sub_category,
        "description": p.description,
        "image_url": p.image_url,
        "address": p.address,
        "latitude": p.latitude,
        "longitude": p.longitude,
        "rating": p.rating,
        "reviews_count": p.reviews_count,
        "opening_hours": p.opening_hours,
        "entry_fee": p.entry_fee,
        "best_time_to_visit": p.best_time_to_visit,
        "nearby_station_code": p.nearby_station_code,
        "distance_from_station_km": p.distance_from_station_km,
        "is_featured": p.is_featured
    }


@router.post("/wishlist/toggle")
def toggle_wishlist_place(
    payload: WishlistTogglePayload,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Add or remove a place from passenger's personal travel wishlist.
    """
    user_id = current_user.id if current_user else 1  # Fallback to demo user if anonymous

    existing = db.query(SavedWishlistPlace).filter(
        SavedWishlistPlace.user_id == user_id,
        SavedWishlistPlace.place_id == payload.place_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"saved": False, "message": "Removed from your travel wishlist."}
    else:
        new_item = SavedWishlistPlace(
            user_id=user_id,
            place_id=payload.place_id,
            notes=payload.notes or ""
        )
        db.add(new_item)
        db.commit()
        return {"saved": True, "message": "Saved to your travel wishlist!"}


@router.get("/wishlist")
def get_user_wishlist(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Retrieve passenger's saved wishlist places.
    """
    user_id = current_user.id if current_user else 1
    items = db.query(SavedWishlistPlace).filter(SavedWishlistPlace.user_id == user_id).all()

    results = []
    for it in items:
        p = it.place
        if p:
            results.append({
                "wishlist_id": it.id,
                "place_id": p.id,
                "name": p.name,
                "city": p.city,
                "category": p.category,
                "image_url": p.image_url,
                "rating": p.rating,
                "address": p.address,
                "notes": it.notes,
                "saved_at": it.created_at.isoformat() if it.created_at else ""
            })
    return results
