import json
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import Incident, AuditLog, User, IncidentDuplicate
from app.schemas.schemas import IncidentCreate, IncidentUpdate, IncidentStatusUpdate
from app.core.security import get_current_user_optional, get_current_user
from app.workflows.orchestrator import orchestrator

router = APIRouter(prefix="/incidents", tags=["Emergency Incidents"])


from app.services.complaint_ai_service import complaint_ai_service

# In-memory idempotency cache for deduplicating offline sync attempts
PROCESSED_IDEMPOTENCY_KEYS: Dict[str, int] = {}


class VoiceAssistRequest(BaseModel):
    audio_transcript: str
    selected_language: Optional[str] = None


class ImageAssistRequest(BaseModel):
    image_base64: str
    mime_type: Optional[str] = "image/jpeg"
    filename: Optional[str] = None


class OfflineSyncPayload(BaseModel):
    items: List[Dict[str, Any]]


@router.post("/voice-assist", summary="Module 1: Multilingual Voice-Based Complaint Assistant")
async def voice_assist(payload: VoiceAssistRequest):
    """
    Processes voice transcript spoken in Tamil, Hindi, or other regional languages.
    Uses Gemini API to detect language, translate to English, and extract structured complaint fields.
    """
    if not payload.audio_transcript.strip():
        raise HTTPException(status_code=400, detail="Voice transcript cannot be empty.")
    
    result = await complaint_ai_service.process_voice_complaint(
        transcript_text=payload.audio_transcript,
        user_selected_language=payload.selected_language
    )
    return result


@router.post("/image-assist", summary="Module 3: AI-Powered Image-Based Complaint Assistant")
async def image_assist(payload: ImageAssistRequest):
    """
    Analyzes photograph uploaded by passenger using Gemini Vision multimodal AI.
    Observes visible defect, suggests category (without assuming unverified facts),
    generates draft description, and prompts for missing coach/seat details.
    """
    if not payload.image_base64:
        raise HTTPException(status_code=400, detail="Image data is required.")
    
    result = await complaint_ai_service.analyze_complaint_image(
        image_base64=payload.image_base64,
        mime_type=payload.mime_type or "image/jpeg",
        filename=payload.filename
    )
    return result


@router.post("/sync-offline", summary="Module 2: Synchronize Offline-Recorded Complaints with Idempotency")
async def sync_offline_incidents(
    payload: OfflineSyncPayload,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Module 2: Offline Complaint Storage and Synchronisation.
    Safely synchronizes complaints recorded in IndexedDB during network dead zones.
    Enforces idempotency checks so repeated retries never create duplicate tickets.
    Explicitly distinguishes locally saved drafts from officially received complaints.
    """
    synced_results = []
    for item in payload.items:
        offline_id = item.get("offline_id", "OFFLINE_TEMP")
        idempotency_key = item.get("idempotency_key") or offline_id
        offline_ts = item.get("offline_timestamp", "Unknown Offline Time")

        # 1. Idempotency Check: Prevent duplicate submissions on network jitter/retry
        if idempotency_key in PROCESSED_IDEMPOTENCY_KEYS:
            existing_id = PROCESSED_IDEMPOTENCY_KEYS[idempotency_key]
            synced_results.append({
                "offline_id": offline_id,
                "idempotency_key": idempotency_key,
                "server_incident_id": existing_id,
                "status": "ALREADY_SYNCHRONIZED",
                "is_officially_submitted": True,
                "message": f"Idempotency verified. Existing incident #{existing_id} preserved without duplicate creation."
            })
            continue

        # 2. Create official server incident record
        incident = Incident(
            passenger_id=current_user.id if current_user else None,
            passenger_name=item.get("passenger_name") or (current_user.full_name if current_user else "Passenger (IndexedDB Sync)"),
            passenger_contact=item.get("passenger_contact") or "",
            train_number=str(item.get("train_number", "12393")).strip(),
            train_name=item.get("train_name") or f"Train #{item.get('train_number')}",
            coach_number=str(item.get("coach_number", "B1")).strip().upper(),
            seat_number=str(item.get("seat_number", "")),
            description=f"[OFFLINE REPORT RECORDED AT: {offline_ts}] {item.get('description', '').strip()}",
            category=item.get("category") or "Other emergency",
            reported_language=item.get("reported_language") or "en",
            reported_location=item.get("reported_location") or "En-Route (Recorded in Offline IndexedDB)",
            current_station_code=item.get("current_station_code") or "",
            image_url=item.get("image_url") or "",
            status="REPORTED"
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)

        # Store in idempotency registry
        PROCESSED_IDEMPOTENCY_KEYS[idempotency_key] = incident.id

        # 3. Log Immutable Audit Entry for Offline Sync Innovation
        audit = AuditLog(
            incident_id=incident.id,
            action="OFFLINE_COMPLAINT_SYNCED_INDEXEDDB",
            actor_name="RailResQ IndexedDB Sync Engine",
            actor_role="SYSTEM_OFFLINE_SYNC",
            explanation=f"Offline complaint {offline_id} (Idempotency: {idempotency_key}) recorded at {offline_ts} while in network dead-zone was officially validated and synchronized with central database."
        )
        db.add(audit)
        db.commit()

        # 4. Trigger multi-agent pipeline
        await orchestrator.process_new_incident(db, incident)

        synced_results.append({
            "offline_id": offline_id,
            "idempotency_key": idempotency_key,
            "server_incident_id": incident.id,
            "train_number": incident.train_number,
            "coach_number": incident.coach_number,
            "priority": incident.suggested_priority,
            "status": "OFFICIALLY_RECEIVED_BY_RAILRESQ",
            "is_officially_submitted": True,
            "offline_timestamp": offline_ts,
            "synced_at": incident.created_at.isoformat() if incident.created_at else None
        })

    return {
        "success": True,
        "synced_count": len(synced_results),
        "message": f"Successfully synchronized {len(synced_results)} offline complaint(s). Official incident tickets registered.",
        "synced_incidents": synced_results
    }


@router.post("", summary="Submit New Passenger Emergency Report")
async def submit_incident(
    incident_in: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Submits an emergency report from a passenger. Immediately kicks off the
    multi-agent workflow: AI understanding, safety priority engine, duplicate detection,
    resource coordination, and station handover recommendations.
    """
    incident = Incident(
        passenger_id=current_user.id if current_user else None,
        passenger_name=incident_in.passenger_name or (current_user.full_name if current_user else "Passenger"),
        passenger_contact=incident_in.passenger_contact or "",
        train_number=incident_in.train_number.strip(),
        train_name=incident_in.train_name or f"Express #{incident_in.train_number}",
        coach_number=incident_in.coach_number.strip().upper(),
        seat_number=incident_in.seat_number or "",
        description=incident_in.description.strip(),
        category=incident_in.category or "Other emergency",
        reported_language=incident_in.reported_language or "en",
        reported_location=incident_in.reported_location or "",
        current_station_code=incident_in.current_station_code or "",
        image_url=incident_in.image_url,
        status="REPORTED"
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    # Process through Agent Orchestrator
    pipeline_result = await orchestrator.process_new_incident(db, incident)

    return {
        "success": True,
        "message": "Emergency incident submitted and triaged successfully",
        "incident_id": incident.id,
        "train_number": incident.train_number,
        "coach_number": incident.coach_number,
        "category": incident.category,
        "suggested_priority": incident.suggested_priority,
        "approved_priority": incident.approved_priority,
        "status": incident.status,
        "ai_summary": incident.ai_summary,
        "potential_duplicates_count": pipeline_result.get("potential_duplicates_count", 0),
        "potential_duplicates": pipeline_result.get("potential_duplicates", []),
        "handover_recommendation": pipeline_result.get("handover_recommendation"),
        "recommended_resources": pipeline_result.get("recommended_resources"),
        "created_at": incident.created_at.isoformat() if incident.created_at else None
    }


@router.get("", summary="List All Emergency Incidents with Filters")
def list_incidents(
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    train_number: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: Session = Depends(get_db)
):
    query = db.query(Incident)

    if category:
        query = query.filter(Incident.category == category)
    if priority:
        query = query.filter(Incident.approved_priority == priority)
    if train_number:
        query = query.filter(Incident.train_number == train_number)
    if status_filter:
        query = query.filter(Incident.status == status_filter)
    if search:
        query = query.filter(
            (Incident.description.ilike(f"%{search}%")) |
            (Incident.train_number.ilike(f"%{search}%")) |
            (Incident.coach_number.ilike(f"%{search}%"))
        )

    total_count = query.count()
    incidents = query.order_by(Incident.id.desc()).offset(offset).limit(limit).all()

    results = []
    for inc in incidents:
        rules = []
        try:
            rules = json.loads(inc.priority_rules_triggered or "[]")
        except Exception:
            rules = []

        results.append({
            "id": inc.id,
            "train_number": inc.train_number,
            "train_name": inc.train_name,
            "coach_number": inc.coach_number,
            "seat_number": inc.seat_number,
            "category": inc.category,
            "description": inc.description,
            "ai_summary": inc.ai_summary,
            "suggested_priority": inc.suggested_priority,
            "approved_priority": inc.approved_priority,
            "priority_rules_triggered": rules,
            "reported_location": inc.reported_location,
            "status": inc.status,
            "image_url": inc.image_url,
            "passenger_name": inc.passenger_name,
            "reported_language": inc.reported_language,
            "created_at": inc.created_at.isoformat() if inc.created_at else None
        })

    return {
        "total": total_count,
        "items": results
    }


@router.get("/{incident_id}", summary="Get Incident Deep Details")
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Fetch related duplicates directly from database
    dup_records = db.query(IncidentDuplicate).filter(
        (IncidentDuplicate.incident_id == incident_id) |
        (IncidentDuplicate.possible_duplicate_id == incident_id)
    ).all()

    duplicates = [
        {
            "id": d.id,
            "possible_duplicate_id": d.possible_duplicate_id if d.incident_id == incident_id else d.incident_id,
            "similarity_score": d.similarity_score,
            "match_reasons": json.loads(d.match_reasons) if d.match_reasons else [],
            "review_status": d.review_status
        }
        for d in dup_records
    ]

    # Fetch handover recommendation
    handovers = [
        {
            "id": h.id,
            "station_name": h.station.station_name if h.station else "N/A",
            "station_code": h.station.station_code if h.station else "N/A",
            "eta_minutes": h.eta_minutes,
            "reason": h.recommendation_reason,
            "confidence": h.confidence,
            "approval_status": h.approval_status,
            "recommended_resource": h.resource.resource_name if h.resource else "None"
        }
        for h in incident.handovers
    ]

    # Fetch assignments
    assignments = [
        {
            "id": a.id,
            "resource_id": a.resource_id,
            "resource_name": a.resource.resource_name if a.resource else "Unit",
            "resource_type": a.resource.resource_type if a.resource else "Support",
            "assignment_status": a.assignment_status,
            "assigned_at": a.assigned_at.isoformat() if a.assigned_at else None,
            "acknowledged_at": a.acknowledged_at.isoformat() if a.acknowledged_at else None,
            "deadline_at": a.deadline_at.isoformat() if a.deadline_at else None,
        }
        for a in incident.assignments
    ]

    return {
        "id": incident.id,
        "train_number": incident.train_number,
        "train_name": incident.train_name,
        "coach_number": incident.coach_number,
        "seat_number": incident.seat_number,
        "category": incident.category,
        "description": incident.description,
        "ai_summary": incident.ai_summary,
        "ai_extracted_data": json.loads(incident.ai_extracted_data) if incident.ai_extracted_data else {},
        "suggested_priority": incident.suggested_priority,
        "approved_priority": incident.approved_priority,
        "priority_rules_triggered": json.loads(incident.priority_rules_triggered or "[]"),
        "reported_location": incident.reported_location,
        "status": incident.status,
        "image_url": incident.image_url,
        "passenger_name": incident.passenger_name,
        "passenger_contact": incident.passenger_contact,
        "reported_language": incident.reported_language,
        "created_at": incident.created_at.isoformat() if incident.created_at else None,
        "handovers": handovers,
        "assignments": assignments
    }


@router.patch("/{incident_id}", summary="Operator Review: Update Category / Priority / Location")
def update_incident(
    incident_id: int,
    update_data: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    changes = []
    if update_data.approved_priority and update_data.approved_priority != incident.approved_priority:
        changes.append(f"Priority: {incident.approved_priority} -> {update_data.approved_priority}")
        incident.approved_priority = update_data.approved_priority

    if update_data.category and update_data.category != incident.category:
        changes.append(f"Category: {incident.category} -> {update_data.category}")
        incident.category = update_data.category

    if update_data.status and update_data.status != incident.status:
        changes.append(f"Status: {incident.status} -> {update_data.status}")
        incident.status = update_data.status

    if update_data.reported_location:
        incident.reported_location = update_data.reported_location

    if changes:
        audit = AuditLog(
            actor_id=current_user.id,
            actor_name=current_user.full_name,
            actor_role=current_user.role,
            incident_id=incident.id,
            action="OPERATOR_MODIFIED_INCIDENT",
            explanation=f"Operator verified/modified fields: {'; '.join(changes)}. Reason: {update_data.explanation}"
        )
        db.add(audit)
        db.commit()

    return {"success": True, "message": "Incident updated by operator", "incident_id": incident.id}


@router.patch("/{incident_id}/status", summary="Update Incident Lifecycle Status")
def update_status(
    incident_id: int,
    status_data: IncidentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    prev_status = incident.status
    incident.status = status_data.status

    audit = AuditLog(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        incident_id=incident.id,
        action="INCIDENT_STATUS_CHANGE",
        previous_value=prev_status,
        new_value=status_data.status,
        explanation=status_data.notes or f"Status shifted from {prev_status} to {status_data.status}"
    )
    db.add(audit)
    db.commit()

    return {"success": True, "incident_id": incident.id, "new_status": incident.status}
