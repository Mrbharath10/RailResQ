import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import ResponseResource, Station, AuditLog, User
from app.schemas.schemas import ResourceCreate, ResourceUpdate
from app.core.security import get_current_user

router = APIRouter(prefix="/resources", tags=["Emergency Response Resources"])


@router.get("", summary="List All Response Resources")
def list_resources(
    resource_type: Optional[str] = Query(None),
    availability: Optional[str] = Query(None),
    station_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(ResponseResource).filter(ResponseResource.is_active == True)

    if resource_type:
        query = query.filter(ResponseResource.resource_type == resource_type)
    if availability:
        query = query.filter(ResponseResource.availability_status == availability)
    if station_id:
        query = query.filter(ResponseResource.station_id == station_id)

    resources = query.all()
    results = []
    for r in resources:
        results.append({
            "id": r.id,
            "resource_code": r.resource_code,
            "resource_name": r.resource_name,
            "resource_type": r.resource_type,
            "station_id": r.station_id,
            "station_name": r.station.station_name if r.station else "N/A",
            "station_code": r.station.station_code if r.station else "N/A",
            "capabilities": json.loads(r.capabilities or "[]"),
            "contact_information": r.contact_information,
            "availability_status": r.availability_status,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })
    return results


@router.post("", summary="Register New Response Resource (Admin)")
def create_resource(
    res_in: ResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(ResponseResource).filter(ResponseResource.resource_code == res_in.resource_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Resource code already exists")

    new_res = ResponseResource(
        resource_code=res_in.resource_code,
        resource_name=res_in.resource_name,
        resource_type=res_in.resource_type,
        station_id=res_in.station_id,
        capabilities=json.dumps(res_in.capabilities or []),
        contact_information=res_in.contact_information or "Station Control",
        availability_status=res_in.availability_status or "AVAILABLE",
        is_active=True
    )
    db.add(new_res)
    db.commit()
    db.refresh(new_res)

    audit = AuditLog(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        action="RESOURCE_REGISTERED",
        explanation=f"New response resource '{new_res.resource_name}' ({new_res.resource_type}) added to station #{new_res.station_id}."
    )
    db.add(audit)
    db.commit()

    return {"success": True, "resource_id": new_res.id}


@router.patch("/{resource_id}", summary="Update Resource Status or Details")
def update_resource(
    resource_id: int,
    res_update: ResourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resource = db.query(ResponseResource).filter(ResponseResource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    if res_update.resource_name:
        resource.resource_name = res_update.resource_name
    if res_update.resource_type:
        resource.resource_type = res_update.resource_type
    if res_update.availability_status:
        resource.availability_status = res_update.availability_status
    if res_update.is_active is not None:
        resource.is_active = res_update.is_active

    db.commit()
    return {"success": True, "message": "Resource updated"}
