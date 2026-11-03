import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import ResourceAssignment, ResponseResource, Incident, AuditLog, User
from app.schemas.schemas import AssignmentCreate
from app.core.security import get_current_user
from app.workflows.orchestrator import orchestrator

router = APIRouter(prefix="/assignments", tags=["Resource Dispatch & Acknowledgement Monitoring"])


@router.post("", summary="Operator Dispatch: Assign Resource to Incident")
def create_assignment(
    assign_in: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    incident = db.query(Incident).filter(Incident.id == assign_in.incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    resource = db.query(ResponseResource).filter(ResponseResource.id == assign_in.resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    deadline = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=assign_in.deadline_minutes or 5)

    assignment = ResourceAssignment(
        incident_id=incident.id,
        resource_id=resource.id,
        assigned_by=current_user.id,
        assignment_status="ASSIGNED",
        deadline_at=deadline,
        notes=assign_in.notes or ""
    )
    db.add(assignment)

    # Update resource status to DISPATCHED
    resource.availability_status = "DISPATCHED"
    incident.status = "ASSIGNED"

    audit = AuditLog(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        incident_id=incident.id,
        action="RESOURCE_DISPATCHED",
        explanation=f"Operator dispatched '{resource.resource_name}' to Incident #{incident.id}. Acknowledgement deadline set to {deadline.isoformat()} ({assign_in.deadline_minutes} mins)."
    )
    db.add(audit)
    db.commit()
    db.refresh(assignment)

    return {
        "success": True,
        "assignment_id": assignment.id,
        "incident_id": incident.id,
        "resource_name": resource.resource_name,
        "status": assignment.assignment_status,
        "deadline_at": assignment.deadline_at.isoformat()
    }


@router.get("", summary="List All Resource Assignments")
def list_assignments(
    incident_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    query = db.query(ResourceAssignment)
    if incident_id:
        query = query.filter(ResourceAssignment.incident_id == incident_id)
    if status_filter:
        query = query.filter(ResourceAssignment.assignment_status == status_filter)

    assignments = query.order_by(ResourceAssignment.id.desc()).all()
    results = []
    for a in assignments:
        results.append({
            "id": a.id,
            "incident_id": a.incident_id,
            "train_number": a.incident.train_number if a.incident else "N/A",
            "coach_number": a.incident.coach_number if a.incident else "N/A",
            "category": a.incident.category if a.incident else "N/A",
            "resource_id": a.resource_id,
            "resource_name": a.resource.resource_name if a.resource else "N/A",
            "resource_type": a.resource.resource_type if a.resource else "N/A",
            "assignment_status": a.assignment_status,
            "assigned_at": a.assigned_at.isoformat() if a.assigned_at else None,
            "acknowledged_at": a.acknowledged_at.isoformat() if a.acknowledged_at else None,
            "deadline_at": a.deadline_at.isoformat() if a.deadline_at else None,
            "escalated_at": a.escalated_at.isoformat() if a.escalated_at else None,
            "completed_at": a.completed_at.isoformat() if a.completed_at else None,
            "notes": a.notes
        })
    return results


@router.patch("/{assignment_id}/acknowledge", summary="Simulate or Record Resource Acknowledgement")
def acknowledge(
    assignment_id: int,
    db: Session = Depends(get_db)
):
    result = orchestrator.ack_agent.acknowledge_assignment(db, assignment_id)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result


@router.patch("/{assignment_id}/status", summary="Update Assignment Execution Status")
def update_assignment_status(
    assignment_id: int,
    status_val: str = Query(..., description="IN_PROGRESS or COMPLETED"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assign = db.query(ResourceAssignment).filter(ResourceAssignment.id == assignment_id).first()
    if not assign:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assign.assignment_status = status_val
    if status_val == "COMPLETED":
        assign.completed_at = datetime.datetime.now(datetime.timezone.utc)
        if assign.resource:
            assign.resource.availability_status = "AVAILABLE"
        if assign.incident:
            assign.incident.status = "RESOLVED"

    audit = AuditLog(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        incident_id=assign.incident_id,
        action="ASSIGNMENT_STATUS_UPDATE",
        new_value=status_val,
        explanation=f"Resource assignment status changed to {status_val}."
    )
    db.add(audit)
    db.commit()

    return {"success": True, "assignment_id": assign.id, "new_status": status_val}


@router.post("/check-deadlines", summary="Run Automated Background Acknowledgement Monitoring")
def trigger_deadline_check(db: Session = Depends(get_db)):
    escalations = orchestrator.ack_agent.check_deadlines(db)
    return {
        "success": True,
        "escalations_count": len(escalations),
        "escalations": escalations
    }
