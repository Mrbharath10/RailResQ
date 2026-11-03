import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import IncidentDuplicate, Incident, AuditLog, User
from app.schemas.schemas import DuplicateReviewRequest
from app.core.security import get_current_user

router = APIRouter(prefix="/duplicates", tags=["Duplicate Emergency Detection"])


@router.get("", summary="List All Flagged Duplicate Pairs")
def list_duplicates(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(IncidentDuplicate)
    if status_filter:
        query = query.filter(IncidentDuplicate.review_status == status_filter)

    records = query.order_by(IncidentDuplicate.id.desc()).all()
    results = []
    for r in records:
        inc = db.query(Incident).filter(Incident.id == r.incident_id).first()
        dup = db.query(Incident).filter(Incident.id == r.possible_duplicate_id).first()
        results.append({
            "id": r.id,
            "incident_id": r.incident_id,
            "incident_train": inc.train_number if inc else "N/A",
            "incident_coach": inc.coach_number if inc else "N/A",
            "incident_desc": inc.description if inc else "",
            "possible_duplicate_id": r.possible_duplicate_id,
            "possible_duplicate_train": dup.train_number if dup else "N/A",
            "possible_duplicate_coach": dup.coach_number if dup else "N/A",
            "possible_duplicate_desc": dup.description if dup else "",
            "similarity_score": r.similarity_score,
            "match_reasons": json.loads(r.match_reasons or "[]"),
            "review_status": r.review_status,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })
    return results


@router.post("/review", summary="Operator Review: Confirm or Reject Duplicate Incident Match")
def review_duplicate(
    review_data: DuplicateReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rec = db.query(IncidentDuplicate).filter(IncidentDuplicate.id == review_data.duplicate_record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Duplicate record not found")

    rec.review_status = review_data.review_status
    rec.reviewed_by = current_user.id

    audit = AuditLog(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        incident_id=rec.incident_id,
        action=f"DUPLICATE_{review_data.review_status}",
        new_value=review_data.review_status,
        explanation=f"Operator verified potential duplicate between #{rec.incident_id} and #{rec.possible_duplicate_id}. Decision: {review_data.review_status}. Notes: {review_data.notes}"
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "duplicate_record_id": rec.id,
        "review_status": rec.review_status,
        "reviewed_by": current_user.full_name
    }
