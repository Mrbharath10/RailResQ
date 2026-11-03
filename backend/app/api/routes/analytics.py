from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.entities import Incident, ResponseResource, ResourceAssignment, AuditLog, Notification

router = APIRouter(prefix="/analytics", tags=["System Analytics & Audit Trails"])


@router.get("/overview", summary="Control-Room Operational KPI Metrics")
def get_kpis(db: Session = Depends(get_db)):
    total_incidents = db.query(Incident).count()
    active_incidents = db.query(Incident).filter(Incident.status.in_(["REPORTED", "TRIAGED", "ASSIGNED", "IN_PROGRESS"])).count()
    resolved_incidents = db.query(Incident).filter(Incident.status.in_(["RESOLVED", "CLOSED"])).count()

    # Priority Breakdown
    priority_counts = dict(
        db.query(Incident.approved_priority, func.count(Incident.id))
        .group_by(Incident.approved_priority).all()
    )

    # Category Breakdown
    category_counts = dict(
        db.query(Incident.category, func.count(Incident.id))
        .group_by(Incident.category).all()
    )

    # Resource Status Breakdown
    resource_status = dict(
        db.query(ResponseResource.availability_status, func.count(ResponseResource.id))
        .group_by(ResponseResource.availability_status).all()
    )

    # Overdue assignments count
    overdue_count = db.query(ResourceAssignment).filter(ResourceAssignment.assignment_status == "OVERDUE").count()

    return {
        "summary": {
            "total_incidents": total_incidents,
            "active_incidents": active_incidents,
            "resolved_incidents": resolved_incidents,
            "overdue_alerts": overdue_count,
            "available_resources": resource_status.get("AVAILABLE", 0),
            "dispatched_resources": resource_status.get("DISPATCHED", 0)
        },
        "priority_distribution": {
            "CRITICAL": priority_counts.get("CRITICAL", 0),
            "HIGH": priority_counts.get("HIGH", 0),
            "MEDIUM": priority_counts.get("MEDIUM", 0),
            "LOW": priority_counts.get("LOW", 0),
        },
        "category_distribution": category_counts,
        "resource_distribution": resource_status
    }


@router.get("/audit-logs", summary="Full System Audit Trail")
def get_audit_logs(
    incident_id: int = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if incident_id:
        query = query.filter(AuditLog.incident_id == incident_id)

    logs = query.order_by(AuditLog.id.desc()).limit(limit).all()
    return [
        {
            "id": log.id,
            "actor_name": log.actor_name,
            "actor_role": log.actor_role,
            "incident_id": log.incident_id,
            "action": log.action,
            "previous_value": log.previous_value,
            "new_value": log.new_value,
            "explanation": log.explanation,
            "created_at": log.created_at.isoformat() if log.created_at else None
        }
        for log in logs
    ]


@router.get("/notifications", summary="Control-Room Operational Notifications")
def get_notifications(
    limit: int = Query(30),
    db: Session = Depends(get_db)
):
    notifs = db.query(Notification).order_by(Notification.id.desc()).limit(limit).all()
    return [
        {
            "id": n.id,
            "incident_id": n.incident_id,
            "message": n.message,
            "type": n.notification_type,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None
        }
        for n in notifs
    ]


@router.patch("/notifications/{notif_id}/read", summary="Mark Notification as Read")
def mark_read(notif_id: int, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notif_id).first()
    if n:
        n.is_read = True
        db.commit()
    return {"success": True}
