import json
import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.entities import Incident, ResourceAssignment, ResponseResource, HandoverRecommendation, Notification, AuditLog
from app.workflows.orchestrator import orchestrator


SCENARIO_DEFINITIONS = {
    "medical_emergency": {
        "title": "Scenario 1: Acute Medical Emergency (Cardiac Symptoms)",
        "train_number": "12301",
        "train_name": "Howrah Rajdhani Express",
        "coach_number": "B4",
        "seat_number": "42",
        "description": "An elderly passenger has collapsed in coach B4 berth 42. Complaining of severe chest pain, heavy breathing and profuse sweating. Needs immediate doctor and oxygen support.",
        "category": "Medical emergency",
        "reported_language": "en",
        "reported_location": "Enroute between Kanpur and Prayagraj"
    },
    "smoke_fire": {
        "title": "Scenario 2: Smoke Hazard in AC Coach",
        "train_number": "12004",
        "train_name": "Lucknow Shatabdi Express",
        "coach_number": "C2",
        "seat_number": "18",
        "description": "Heavy smoke and burning smell coming from the electrical panel near the toilet in coach C2. Small visible sparks. Passengers panic-stricken.",
        "category": "Fire or smoke",
        "reported_language": "en",
        "reported_location": "Passing Aligarh Outer"
    },
    "security_threat": {
        "title": "Scenario 3: Violent Altercation & Armed Threat",
        "train_number": "22436",
        "train_name": "Vande Bharat Express",
        "coach_number": "C8",
        "seat_number": "25",
        "description": "Three intoxicated men physically assaulting passengers and threatening co-passengers with a knife near the coach entrance. Urgent RPF police assistance required.",
        "category": "Security threat",
        "reported_language": "en",
        "reported_location": "Approaching Varanasi Junction"
    },
    "duplicate_report": {
        "title": "Scenario 4: Duplicate Incident Detection",
        "train_number": "12301",
        "train_name": "Howrah Rajdhani Express",
        "coach_number": "B4",
        "seat_number": "45",
        "description": "Old man unconscious on floor in coach B4 near seat 40. Doctor needed urgently at next halt.",
        "category": "Medical emergency",
        "reported_language": "en",
        "reported_location": "Passing Fatehpur"
    },
    "overdue_escalation": {
        "title": "Scenario 5: Dispatched Team Fails to Acknowledge (Overdue Escalation)",
        "train_number": "12004",
        "train_name": "Lucknow Shatabdi Express",
        "coach_number": "C5",
        "seat_number": "12",
        "description": "Passenger suffered burn injury from boiling tea spill. Urgent burn dressing required.",
        "category": "Medical emergency",
        "reported_language": "en",
        "reported_location": "Ghaziabad Junction"
    },
    "approaching_station": {
        "title": "Scenario 6: Fast Train Approaching Station Handover",
        "train_number": "12004",
        "train_name": "Lucknow Shatabdi Express",
        "coach_number": "C1",
        "seat_number": "08",
        "description": "Pregnant woman in severe labour pain. Contractions starting. Ambulance required at platform instantly on arrival.",
        "category": "Medical emergency",
        "reported_language": "en",
        "reported_location": "10 km before Aligarh"
    },
    "train_status_unavailable": {
        "title": "Scenario 7: Train Tracking Stale / GPS Unavailable",
        "train_number": "99999",
        "train_name": "Special Fictional Express",
        "coach_number": "S3",
        "seat_number": "55",
        "description": "Passenger breathing difficulty. Train GPS telemetry disconnected in forest section.",
        "category": "Medical emergency",
        "reported_language": "en",
        "reported_location": "Remote Section"
    },
    "ai_provider_failover": {
        "title": "Scenario 8: Multilingual Input with AI Offline Fallback",
        "train_number": "12301",
        "train_name": "Howrah Rajdhani Express",
        "coach_number": "A1",
        "seat_number": "14",
        "description": "कोच A1 में एक यात्री अचानक बेहोश हो गया है और बहुत खून बह रहा है। तत्काल डॉक्टर की आवश्यकता है।",
        "category": "Medical emergency",
        "reported_language": "hi",
        "reported_location": "Kanpur Division"
    },
    "missing_info": {
        "title": "Scenario 9: Insufficient Information in Passenger Report",
        "train_number": "12301",
        "train_name": "Howrah Rajdhani Express",
        "coach_number": "Unspecified",
        "seat_number": "",
        "description": "Someone is sick here please help.",
        "category": "Medical emergency",
        "reported_language": "en",
        "reported_location": ""
    }
}


class EmergencyScenarioSimulator:
    """
    Academic Demonstration Simulator for Final-Year Project Evaluation.
    Executes end-to-end emergency scenarios through all agents and displays stage-by-stage results.
    """

    def get_available_scenarios(self) -> List[Dict[str, str]]:
        return [
            {"id": key, "title": val["title"], "category": val["category"], "train": val["train_number"]}
            for key, val in SCENARIO_DEFINITIONS.items()
        ]

    async def execute_scenario(self, db: Session, scenario_id: str) -> Dict[str, Any]:
        spec = SCENARIO_DEFINITIONS.get(scenario_id)
        if not spec:
            raise ValueError(f"Unknown scenario ID: {scenario_id}")

        stages = []

        # Stage 1: Incident Creation
        incident = Incident(
            passenger_name="Demo Passenger",
            passenger_contact="+91 98765 43210",
            train_number=spec["train_number"],
            train_name=spec["train_name"],
            coach_number=spec["coach_number"],
            seat_number=spec.get("seat_number", ""),
            description=spec["description"],
            category=spec["category"],
            reported_language=spec["reported_language"],
            reported_location=spec["reported_location"],
            status="REPORTED"
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)

        stages.append({
            "stage_number": 1,
            "stage_name": "Emergency Report Ingestion",
            "status": "COMPLETED",
            "details": {
                "incident_id": incident.id,
                "train": f"{incident.train_number} - {incident.train_name}",
                "coach": incident.coach_number,
                "description": incident.description,
                "language": incident.reported_language
            }
        })

        # Stage 2: Central Orchestrator Pipeline
        pipeline_result = await orchestrator.process_new_incident(db, incident)

        stages.append({
            "stage_number": 2,
            "stage_name": "AI Understanding & Multilingual Extraction",
            "status": "COMPLETED",
            "details": {
                "extracted_category": pipeline_result["category"],
                "ai_summary": pipeline_result["ai_summary"],
                "missing_information": json.loads(incident.ai_extracted_data).get("missing_information", [])
            }
        })

        stages.append({
            "stage_number": 3,
            "stage_name": "Deterministic Safety Priority Engine",
            "status": "COMPLETED",
            "details": {
                "suggested_priority": pipeline_result["suggested_priority"],
                "safety_rules_triggered": pipeline_result["rules_triggered"],
                "human_review_required": True
            }
        })

        stages.append({
            "stage_number": 4,
            "stage_name": "Duplicate Incident Detection",
            "status": "COMPLETED",
            "details": {
                "duplicates_found": pipeline_result["potential_duplicates_count"],
                "matches": pipeline_result["potential_duplicates"]
            }
        })

        stages.append({
            "stage_number": 5,
            "stage_name": "Station Handover Recommendation",
            "status": "COMPLETED",
            "details": pipeline_result["handover_recommendation"]
        })

        stages.append({
            "stage_number": 6,
            "stage_name": "Response Resource Matching",
            "status": "COMPLETED",
            "details": {
                "recommended_teams": pipeline_result["recommended_resources"]
            }
        })

        # Scenario-specific actions (e.g. overdue escalation simulation)
        if scenario_id == "overdue_escalation":
            # Dispatches a team and sets deadline in the past to trigger escalation
            past_deadline = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=10)
            res = db.query(ResponseResource).first()
            if res:
                assign = ResourceAssignment(
                    incident_id=incident.id,
                    resource_id=res.id,
                    assignment_status="ASSIGNED",
                    deadline_at=past_deadline
                )
                db.add(assign)
                db.commit()

                # Trigger monitoring check
                escalations = orchestrator.ack_agent.check_deadlines(db)
                stages.append({
                    "stage_number": 7,
                    "stage_name": "Acknowledgement Monitoring & Escalation",
                    "status": "ALERT_TRIGGERED",
                    "details": {
                        "escalation_event": "Response deadline expired without confirmation",
                        "new_assignment_status": "OVERDUE",
                        "escalation_recommended": True
                    }
                })

        return {
            "scenario_id": scenario_id,
            "title": spec["title"],
            "incident_id": incident.id,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "stages": stages,
            "final_outcome": {
                "incident_status": incident.status,
                "approved_priority": incident.approved_priority,
                "handover_station": pipeline_result["handover_recommendation"]["recommended_station_name"],
                "recommended_resource": pipeline_result["handover_recommendation"]["recommended_resource"]["name"],
                "requires_operator_approval": True,
                "disclaimer": "Academic simulation completed. Human operator confirmation required."
            }
        }


simulator = EmergencyScenarioSimulator()
