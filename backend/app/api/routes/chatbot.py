from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.config import settings
from app.services.chatbot_service import chatbot_service
from app.schemas.schemas import IncidentCreate
from app.api.routes.incidents import submit_incident

router = APIRouter(prefix="/chat", tags=["AI Emergency Chatbot & Gemini Assistant"])


class ChatMessageRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = []
    user_role: Optional[str] = "passenger"
    current_train: Optional[str] = None


class ChatMessageResponse(BaseModel):
    reply: str
    source: str
    intent: Optional[str] = "GENERAL"
    action_data: Optional[Dict[str, Any]] = None
    suggested_actions: List[str] = []
    train_context: Optional[Dict[str, Any]] = None


@router.get("/status", summary="Get Chatbot & Gemini AI Integration Status")
def get_chat_status():
    """
    Returns the active Gemini AI configuration status and available models.
    """
    has_key = bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 5)
    masked_key = f"{settings.GEMINI_API_KEY[:4]}...{settings.GEMINI_API_KEY[-4:]}" if has_key else "NOT_CONFIGURED"
    return {
        "status": "ACTIVE" if has_key else "LOCAL_RULES_FALLBACK",
        "gemini_configured": has_key,
        "masked_key": masked_key,
        "model": settings.GEMINI_MODEL or "gemini-1.5-flash",
        "multilingual_support": ["en", "hi", "ta", "te", "bn", "mr", "gu", "kn", "ml"],
        "capabilities": [
            "Emergency First-Aid Guidance",
            "Live Train Telemetry & NTES Speed/Delay Lookup",
            "One-Click Emergency Incident Filing",
            "Multilingual Voice/Text Understanding"
        ]
    }


@router.post("/message", response_model=ChatMessageResponse, summary="Send Query to RailResQ AI Chatbot")
async def send_chat_message(req: ChatMessageRequest):
    """
    Processes chat queries using Google Gemini 1.5 Flash (with real-time train context injection)
    or local railway safety protocol fallback.
    """
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    result = await chatbot_service.get_chat_response(
        message=req.message.strip(),
        conversation_history=req.conversation_history,
        user_role=req.user_role,
        current_train=req.current_train
    )
    return result


@router.post("/quick-report", summary="1-Click Emergency Incident Filing from Chatbot")
def quick_report_from_chat(
    incident_data: IncidentCreate,
    db: Session = Depends(get_db)
):
    """
    Allows a passenger or chatbot to immediately submit an emergency incident
    into RailResQ's multi-agent coordination pipeline.
    """
    return submit_incident(incident_in=incident_data, db=db, current_user=None)
