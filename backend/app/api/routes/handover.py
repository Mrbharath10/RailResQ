import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import HandoverRecommendation, Incident, AuditLog, User
from app.schemas.schemas import HandoverApproveRequest
from app.core.security import get_current_user
from app.workflows.orchestrator import orchestrator

router = APIRouter(prefix="/handover", tags=["Intelligent Station Handover System"])


@router.post("/recommend/{incident_id}", summary="Generate Intelligent Station Handover Plan")
def recommend_handover(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    result = orchestrator.handover_agent.generate_recommendation(db, incident)
    return result


@router.get("/{incident_id}", summary="Get Handover Recommendations for Incident")
def get_handover(incident_id: int, db: Session = Depends(get_db)):
    handovers = db.query(HandoverRecommendation).filter(
        HandoverRecommendation.incident_id == incident_id
    ).order_by(HandoverRecommendation.id.desc()).all()

    results = []
    for h in handovers:
        results.append({
            "id": h.id,
            "incident_id": h.incident_id,
            "station_id": h.recommended_station_id,
            "station_name": h.station.station_name if h.station else "N/A",
            "station_code": h.station.station_code if h.station else "N/A",
            "latitude": h.station.latitude if h.station else None,
            "longitude": h.station.longitude if h.station else None,
            "resource_id": h.recommended_resource_id,
            "resource_name": h.resource.resource_name if h.resource else "Station Master Coordination",
            "recommendation_reason": h.recommendation_reason,
            "eta_minutes": h.eta_minutes,
            "data_source": h.data_source,
            "confidence": h.confidence,
            "approval_status": h.approval_status,
            "created_at": h.created_at.isoformat() if h.created_at else None
        })
    return results


@router.patch("/{recommendation_id}/approve", summary="Human Operator Approval of Handover Plan")
def approve_handover(
    recommendation_id: int,
    approve_data: HandoverApproveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Consequential action: Requires human operator approval to confirm or reject
    the AI station handover recommendation.
    """
    handover = db.query(HandoverRecommendation).filter(HandoverRecommendation.id == recommendation_id).first()
    if not handover:
        raise HTTPException(status_code=404, detail="Handover recommendation not found")

    new_status = "APPROVED" if approve_data.action.upper() == "APPROVE" else "REJECTED"
    handover.approval_status = new_status
    handover.approved_by = current_user.id
    handover.approved_at = datetime.datetime.now(datetime.timezone.utc)

    station_name = handover.station.station_name if handover.station else f"Station #{handover.recommended_station_id}"

    audit = AuditLog(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        incident_id=handover.incident_id,
        action=f"HANDOVER_RECOMMENDATION_{new_status}",
        previous_value="PENDING",
        new_value=new_status,
        explanation=f"Operator {new_status.lower()} station handover to {station_name}. Notes: {approve_data.notes}"
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "recommendation_id": handover.id,
        "approval_status": handover.approval_status,
        "station_name": station_name,
        "approved_by": current_user.full_name
    }
