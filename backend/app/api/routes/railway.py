from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import Station, Incident
from app.providers.railway_provider import get_railway_provider, train_tracker
from app.providers.railradar_provider import railradar_provider

router = APIRouter(prefix="/railway", tags=["Railway Context & Station Telemetry"])


class QRailConfigRequest(BaseModel):
    api_key: str


@router.get("/qrail/status", summary="Get QRail.in API Integration Status")
def get_qrail_status():
    """
    Returns current configuration status of QRail.in Developer API.
    """
    return train_tracker.get_qrail_config()


@router.post("/qrail/configure", summary="Configure QRail.in Developer API Key")
def configure_qrail(payload: QRailConfigRequest):
    """
    Saves and activates user's QRail.in Developer API key for live Indian Railways tracking.
    """
    train_tracker.set_qrail_api_key(payload.api_key)
    return {
        "success": True,
        "message": "QRail.in API Key configured and active.",
        "config": train_tracker.get_qrail_config()
    }


@router.post("/qrail/test", summary="Test QRail.in Connection with Sample Train (e.g., 12393)")
def test_qrail_connection(
    train_number: str = Query("12393", description="Train number to test (default: 12393)"),
    api_key: Optional[str] = Query(None, description="Optional API key override to test")
):
    """
    Tests live request to https://qrail.in/api/v3/trains/running/{train_number}/today/{api_key}.
    """
    key_to_use = api_key or train_tracker.qrail_api_key
    if not key_to_use:
        return {
            "success": False,
            "message": "No QRail API key configured. Please enter your key.",
            "test_train": train_number,
            "fallback_telemetry": train_tracker.get_train_status(train_number, force_mode="SIMULATED")
        }

    live_res = train_tracker.fetch_from_qrail(train_number, api_key_override=key_to_use)
    if live_res:
        return {
            "success": True,
            "message": f"Successfully connected to QRail.in for train #{train_number}!",
            "data": live_res
        }
    else:
        return {
            "success": False,
            "message": f"QRail.in API did not return live data for #{train_number} (check API key validity or internet connectivity).",
            "fallback_telemetry": train_tracker.get_train_status(train_number, force_mode="SIMULATED")
        }


@router.get("/trains/live-fleet", summary="Get Real-Time Live Running Status of All Monitored Trains")
def get_live_fleet(
    mode: Optional[str] = Query(None, description="LIVE, QRAIL, or SIMULATED"),
    qrail_key: Optional[str] = Query(None, description="Optional QRail.in API key override")
):
    """
    Returns live telemetry, moving GPS coordinates, speeds, delays, and emergency flags
    for all trains in the national railway network (via QRail.in API or corridor telemetry).
    """
    return train_tracker.get_all_trains_fleet(force_mode=mode, qrail_key=qrail_key)


@router.get("/trains/{train_number}/status", summary="Get Train Realtime Context & Live GPS Telemetry")
def get_train_status(
    train_number: str,
    mode: Optional[str] = Query(None, description="LIVE, QRAIL, or SIMULATED"),
    qrail_key: Optional[str] = Query(None, description="Optional QRail.in API key override")
):
    """
    Returns real-time running status, dynamic GPS coordinates, current speed,
    delay minutes, and upcoming station countdown. Integrates QRail.in live API.
    """
    return train_tracker.get_train_status(train_number, force_mode=mode, qrail_key=qrail_key)


@router.get("/trains/{train_number}/schedule", summary="Get Train Route Stations & Schedule")
def get_train_schedule(train_number: str):
    return train_tracker.get_train_schedule(train_number)


@router.get("/stations", summary="List All Registered Railway Stations")
def get_stations(db: Session = Depends(get_db)):
    stations = db.query(Station).filter(Station.is_active == True).all()
    return [
        {
            "id": s.id,
            "station_code": s.station_code,
            "station_name": s.station_name,
            "division": s.division,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "has_medical_facility": s.has_medical_facility,
            "has_fire_support": s.has_fire_support,
            "resource_count": len(s.resources)
        }
        for s in stations
    ]


@router.get("/stations/{station_id}", summary="Get Detailed Station Capabilities & Teams")
def get_station_detail(station_id: int, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    return {
        "id": station.id,
        "station_code": station.station_code,
        "station_name": station.station_name,
        "division": station.division,
        "latitude": station.latitude,
        "longitude": station.longitude,
        "has_medical_facility": station.has_medical_facility,
        "has_fire_support": station.has_fire_support,
        "resources": [
            {
                "id": r.id,
                "name": r.resource_name,
                "type": r.resource_type,
                "status": r.availability_status
            }
            for r in station.resources
        ]
    }


# ==========================================
# RailRadar Official API Endpoints
# ==========================================

@router.get("/railradar/status", summary="Get RailRadar Developer API Status")
def get_railradar_status():
    """Returns configuration and capabilities of the RailRadar API integration."""
    return railradar_provider.get_status_info()


@router.get("/trains/{train_number}/coaches", summary="Get Train Coach Composition & Layout")
def get_train_coaches(
    train_number: str,
    station: Optional[str] = Query(None, description="Optional station code for platform alignment"),
    db: Session = Depends(get_db)
):
    """
    Returns train coach position sequence, coach types, berth counts,
    and flags any coaches with active emergency incidents in RailResQ.
    """
    coach_data = railradar_provider.get_coach_composition(train_number, station_code=station)
    
    # Cross-reference with database for active onboard incidents
    active_incidents = db.query(Incident).filter(
        Incident.train_number == train_number,
        Incident.status.notin_(["RESOLVED", "CLOSED"])
    ).all()

    incident_coaches = {inc.coach_number.upper(): inc for inc in active_incidents}

    # Mark active emergency flags on specific coaches
    for coach in coach_data.get("coaches", []):
        c_code = coach["coach_code"].upper()
        if c_code in incident_coaches:
            inc = incident_coaches[c_code]
            coach["has_active_emergency"] = True
            coach["incident_id"] = inc.id
            coach["incident_category"] = inc.category
            coach["incident_priority"] = inc.priority

    return coach_data


@router.get("/stations/{station_code}/live-board", summary="Get Live Station Arrivals & Departures Board")
def get_station_live_board(
    station_code: str,
    hours_ahead: int = Query(4, ge=1, le=8, description="Time window ahead in hours (default: 4)")
):
    """
    Returns the real-time live timetable board for any station,
    including approaching trains, platform numbers, and live delay minutes.
    """
    return railradar_provider.get_station_live(station_code, hours_ahead=hours_ahead)


@router.get("/trains/{train_number}/route-schedule", summary="Get Full Train Schedule & Station Route")
def get_train_route_schedule(
    train_number: str,
    halts_only: bool = Query(True, description="Filter only halting stations")
):
    """
    Returns the complete route timetable sequence from RailRadar.
    """
    res = railradar_provider.get_train_schedule(train_number)
    if res:
        return res
    # Fallback to train_tracker schedule
    return {
        "success": True,
        "source": "RailResQ Verified Schedule",
        "train_number": train_number,
        "route": train_tracker.get_train_schedule(train_number)
    }
