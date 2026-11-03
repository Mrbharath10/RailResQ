import json
import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.entities import Incident, AuditLog, Notification, IncidentDuplicate
from app.agents.incident_agent import IncidentUnderstandingAgent
from app.agents.priority_agent import PriorityAssessmentAgent
from app.agents.duplicate_agent import DuplicateDetectionAgent
from app.agents.resource_agent import ResourceCoordinationAgent
from app.agents.handover_agent import StationHandoverAgent
from app.agents.ack_agent import AcknowledgementMonitoringAgent

logger = logging.getLogger("railresq.orchestrator")


class CentralEmergencyOrchestrator:
    """
    Central Multi-Agent Workflow Orchestrator for RailResQ.
    Coordinates sequential execution of specialized deterministic and AI agents,
    maintains complete audit logging, and enforces human-in-the-loop review.
    """

    def __init__(self):
        self.incident_agent = IncidentUnderstandingAgent()
        self.priority_agent = PriorityAssessmentAgent()
        self.duplicate_agent = DuplicateDetectionAgent()
        self.resource_agent = ResourceCoordinationAgent()
        self.handover_agent = StationHandoverAgent()
        self.ack_agent = AcknowledgementMonitoringAgent()

    async def process_new_incident(self, db: Session, incident: Incident) -> Dict[str, Any]:
        logger.info("Processing new incident #%s on train %s", incident.id, incident.train_number)

        # 1. AI Incident Understanding
        ai_result = await self.incident_agent.analyze_incident(
            description=incident.description,
            reported_category=incident.category,
            language=incident.reported_language or "en"
        )
        incident.category = ai_result.get("category", incident.category)
        incident.ai_summary = ai_result.get("ai_summary", "")
        incident.ai_extracted_data = json.dumps(ai_result.get("extracted_entities", {}))
        incident.translated_text = ai_result.get("translated_description", incident.description)

        # 2. Priority Rule Engine
        priority_result = self.priority_agent.evaluate_priority(
            category=incident.category,
            description=incident.description,
            extracted_entities=ai_result.get("extracted_entities", {})
        )
        incident.suggested_priority = priority_result.get("suggested_priority", "MEDIUM")
        incident.approved_priority = incident.suggested_priority  # default until operator overrides
        incident.priority_rules_triggered = json.dumps(priority_result.get("rules_triggered", []))
        incident.status = "TRIAGED"

        db.commit()

        # 3. Duplicate Incident Detection
        potential_duplicates = self.duplicate_agent.find_potential_duplicates(db, incident)
        for dup in potential_duplicates:
            dup_record = IncidentDuplicate(
                incident_id=incident.id,
                possible_duplicate_id=dup["candidate_id"],
                similarity_score=dup["similarity_score"],
                match_reasons=json.dumps(dup["match_reasons"]),
                review_status="PENDING_REVIEW"
            )
            db.add(dup_record)
        db.commit()

        # 4. Station Handover Recommendation
        handover_rec = self.handover_agent.generate_recommendation(db, incident)

        # 5. Resource Recommendations
        resource_recs = self.resource_agent.recommend_resources(
            db, 
            category=incident.category,
            preferred_station_id=handover_rec.get("recommended_station_id")
        )

        # 6. Audit Trail Logging
        audit = AuditLog(
            actor_id=incident.passenger_id,
            actor_name=incident.passenger_name or "Passenger",
            actor_role="passenger",
            incident_id=incident.id,
            action="INCIDENT_REPORTED_AND_TRIAGED",
            previous_value="NONE",
            new_value=f"Status: TRIAGED | Priority: {incident.suggested_priority}",
            explanation=f"Report processed by AI & deterministic rules. Suggested priority: {incident.suggested_priority}."
        )
        db.add(audit)

        # 7. Create In-App Notification for Control-Room Operators
        alert_msg = (
            f"NEW {incident.suggested_priority} EMERGENCY: Train {incident.train_number} Coach {incident.coach_number} - "
            f"{incident.category}. Handover recommended at {handover_rec.get('recommended_station_name', 'Next Halt')}."
        )
        notif = Notification(
            target_role="operator",
            incident_id=incident.id,
            message=alert_msg,
            notification_type="ALERT"
        )
        db.add(notif)
        db.commit()

        return {
            "incident_id": incident.id,
            "status": incident.status,
            "category": incident.category,
            "ai_summary": incident.ai_summary,
            "suggested_priority": incident.suggested_priority,
            "approved_priority": incident.approved_priority,
            "rules_triggered": priority_result.get("rules_triggered", []),
            "potential_duplicates_count": len(potential_duplicates),
            "potential_duplicates": potential_duplicates,
            "handover_recommendation": handover_rec,
            "recommended_resources": resource_recs
        }


orchestrator = CentralEmergencyOrchestrator()
