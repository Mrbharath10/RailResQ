import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.session import get_db
from app.models.entities import User
from app.models.super_app_entities import EmergencyFacility
from app.api.routes.auth import get_current_user

router = APIRouter(prefix="/safety", tags=["Police & Medical Safety Assistance"])


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two GPS coordinates."""
    r = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(r * c, 2)


class ShareLocationPayload(BaseModel):
    passenger_name: str
    contact_phone: str
    latitude: float
    longitude: float
    location_label: Optional[str] = "En Route Station"
    train_coach: Optional[str] = ""
    message: Optional[str] = "I am sharing my live travel location via RailResQ Safety Network."


@router.get("/facilities")
def get_facilities(
    facility_type: Optional[str] = None,
    city: Optional[str] = None,
    station: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get directory of emergency facilities (Police Stations, Hospitals, 24x7 Ambulance Hubs).
    """
    query = db.query(EmergencyFacility)

    if facility_type and facility_type.upper() != "ALL":
        query = query.filter(EmergencyFacility.facility_type == facility_type.upper())

    if city and city.strip():
        query = query.filter(EmergencyFacility.city.ilike(f"%{city.strip()}%"))

    if station and station.strip():
        query = query.filter(EmergencyFacility.station_code == station.strip().upper())

    facilities = query.order_by(EmergencyFacility.distance_km.asc()).all()

    return [
        {
            "id": f.id,
            "name": f.name,
            "facility_type": f.facility_type,
            "city": f.city,
            "state": f.state,
            "station_code": f.station_code,
            "address": f.address,
            "phone_number": f.phone_number,
            "emergency_helpline": f.emergency_helpline,
            "latitude": f.latitude,
            "longitude": f.longitude,
            "distance_km": f.distance_km,
            "is_24x7": f.is_24x7,
            "has_icu": f.has_icu,
            "ambulances_available": f.ambulances_available
        }
        for f in facilities
    ]


@router.get("/nearest")
def get_nearest_facilities(
    lat: float = Query(..., description="Passenger latitude"),
    lng: float = Query(..., description="Passenger longitude"),
    facility_type: Optional[str] = None,
    limit: int = 5,
    db: Session = Depends(get_db)
):
    """
    Find nearest police stations, hospitals, and ambulances based on passenger live GPS coordinates.
    """
    query = db.query(EmergencyFacility)
    if facility_type and facility_type.upper() != "ALL":
        query = query.filter(EmergencyFacility.facility_type == facility_type.upper())

    facilities = query.all()

    # Calculate real-time haversine distance
    results = []
    for f in facilities:
        dist = haversine_distance(lat, lng, f.latitude, f.longitude)
        results.append({
            "id": f.id,
            "name": f.name,
            "facility_type": f.facility_type,
            "city": f.city,
            "station_code": f.station_code,
            "address": f.address,
            "phone_number": f.phone_number,
            "emergency_helpline": f.emergency_helpline,
            "latitude": f.latitude,
            "longitude": f.longitude,
            "distance_km": dist,
            "is_24x7": f.is_24x7,
            "has_icu": f.has_icu,
            "ambulances_available": f.ambulances_available
        })

    results.sort(key=lambda x: x["distance_km"])
    return results[:limit]


@router.get("/emergency-helplines")
def get_emergency_helplines():
    """
    National & Railway standard emergency contacts.
    """
    return [
        {"name": "National Emergency Helpline", "number": "112", "badge": "24x7 All India", "type": "National"},
        {"name": "Railway Passenger Helpline", "number": "139", "badge": "IRCTC & Rail Madad", "type": "Railway"},
        {"name": "Railway Protection Force (RPF)", "number": "182", "badge": "Onboard Security", "type": "Security"},
        {"name": "National Ambulance Helpline", "number": "108", "badge": "Medical Emergency", "type": "Medical"},
        {"name": "Women Passenger Safety Helpline", "number": "1091", "badge": "RPF Meri Saheli", "type": "Women Safety"},
        {"name": "Fire & Disaster Response", "number": "101", "badge": "Fire Services", "type": "Disaster"}
    ]


@router.post("/share-location")
def share_passenger_location(payload: ShareLocationPayload):
    """
    Simulated location share link generation for family, guardians, or RPF desk.
    """
    share_token = f"LOC-{abs(hash(payload.passenger_name + str(payload.latitude))) % 1000000:06d}"
    tracking_url = f"https://railresq.gov.in/track-passenger?token={share_token}"

    return {
        "success": True,
        "share_token": share_token,
        "tracking_url": tracking_url,
        "passenger_name": payload.passenger_name,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "status": "ACTIVE_BROADCAST",
        "message": f"Live emergency coordinates shared with {payload.contact_phone} and RailResQ Rapid Safety Desk."
    }
