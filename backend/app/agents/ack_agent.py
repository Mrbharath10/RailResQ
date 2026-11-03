import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.entities import ResourceAssignment, Notification, AuditLog, Incident


class AcknowledgementMonitoringAgent:
    """
    Agent 5: Monitors dispatched resource acknowledgement deadlines.
    Triggers automated overdue warnings and escalation recommendations if response is delayed.
    """

    def check_deadlines(self, db: Session) -> List[Dict[str, Any]]:
        now = datetime.datetime.now(datetime.timezone.utc)
        
        # Query active assignments still in ASSIGNED status where deadline has passed
        overdue_assignments = db.query(ResourceAssignment).filter(
            ResourceAssignment.assignment_status == "ASSIGNED",
            ResourceAssignment.deadline_at < now
        ).all()

        escalations = []
        for assign in overdue_assignments:
            assign.assignment_status = "OVERDUE"
            assign.escalated_at = now

            incident = db.query(Incident).filter(Incident.id == assign.incident_id).first()
            resource_name = assign.resource.resource_name if assign.resource else f"Resource #{assign.resource_id}"

            # Create Alert Notification for Control-Room Operators
            alert_msg = (
                f"ESCALATION ALERT: Assigned response unit '{resource_name}' "
                f"failed to acknowledge Incident #{assign.incident_id} (Train {incident.train_number if incident else 'N/A'}) "
                f"within deadline. Urgent operator escalation recommended!"
            )
            
            notif = Notification(
                user_id=None,
                target_role="operator",
                incident_id=assign.incident_id,
                message=alert_msg,
                notification_type="OVERDUE"
            )
            db.add(notif)

            # Record in Audit Trail
            audit = AuditLog(
                actor_id=None,
                actor_name="Acknowledgement Agent",
                actor_role="agent",
                incident_id=assign.incident_id,
                action="ESCALATION_TRIGGERED",
                previous_value="ASSIGNED",
                new_value="OVERDUE",
                explanation=f"Acknowledgement deadline passed at {assign.deadline_at.isoformat()}. Escalation alert generated."
            )
            db.add(audit)

            escalations.append({
                "assignment_id": assign.id,
                "incident_id": assign.incident_id,
                "resource_name": resource_name,
                "deadline_at": assign.deadline_at.isoformat(),
                "status": "OVERDUE",
                "escalation_recommended": True
            })

        if overdue_assignments:
            db.commit()

        return escalations

    def acknowledge_assignment(self, db: Session, assignment_id: int, actor_name: str = "Unit Dispatch") -> Dict[str, Any]:
        assign = db.query(ResourceAssignment).filter(ResourceAssignment.id == assignment_id).first()
        if not assign:
            return {"success": False, "error": "Assignment not found"}

        now = datetime.datetime.now(datetime.timezone.utc)
        prev_status = assign.assignment_status
        assign.assignment_status = "ACKNOWLEDGED"
        assign.acknowledged_at = now

        audit = AuditLog(
            actor_id=None,
            actor_name=actor_name,
            actor_role="resource",
            incident_id=assign.incident_id,
            action="ASSIGNMENT_ACKNOWLEDGED",
            previous_value=prev_status,
            new_value="ACKNOWLEDGED",
            explanation=f"Response team acknowledged dispatch orders at {now.isoformat()}."
        )
        db.add(audit)
        db.commit()

        return {
            "success": True,
            "assignment_id": assign.id,
            "status": "ACKNOWLEDGED",
            "acknowledged_at": now.isoformat()
        }
