import re
import json
import logging
import asyncio
import httpx
from typing import Dict, Any, List, Optional

from app.core.config import settings
from app.providers.railway_provider import train_tracker

logger = logging.getLogger("railresq.services.chatbot")

SYSTEM_INSTRUCTION = """
You are RailResQ AI - an intelligent Railway Emergency Assistant & Passenger Safety Companion for Indian Railways.
Your capabilities:
1. Provide immediate, calm, step-by-step first-aid and safety instructions for emergencies onboard trains (medical, cardiac, stroke, fire/smoke, robbery, suspicious unattended objects, safety hazards).
2. Answer train status and route queries using real-time Indian Railways data.
3. Understand and reply fluently in whatever language the user speaks (English, Hindi, Tamil, Telugu, Bengali, Marathi, etc.).
4. When a passenger describes an emergency, clearly summarize the issue, give immediate survival steps, and advise reporting it to the train TTE / Control Room.
5. Emphasize that RailResQ is an academic decision-support system, and human control-room operators verify and approve all emergency dispatches.
Keep answers concise, direct, helpful, and reassuring.
"""

class RailResQChatbotService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL or "gemini-1.5-flash"

    async def get_chat_response(
        self,
        message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        user_role: str = "passenger",
        current_train: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Processes a chat query, optionally fetches live train context, and queries Gemini.
        Falls back to local safety rules if Gemini is unreachable.
        """
        conversation_history = conversation_history or []
        
        # 1. Check if user is asking about a specific train or if a train context is active
        train_context_str = ""
        train_matches = re.findall(r"\b(\d{5})\b", message)
        target_train = train_matches[0] if train_matches else current_train

        train_status_data = None
        if target_train:
            try:
                train_status_data = train_tracker.get_train_status(target_train)
                train_context_str = (
                    f"\n[REALTIME TRAIN CONTEXT FOR #{target_train}]:\n"
                    f"Train Name: {train_status_data.get('train_name')}\n"
                    f"Current Status: {train_status_data.get('current_status')}\n"
                    f"Current Speed: {train_status_data.get('speed_kmph')} km/h\n"
                    f"Delay: {train_status_data.get('delay_minutes')} mins ({train_status_data.get('delay_status')})\n"
                    f"Next Halt: {train_status_data.get('next_station_name')} ({train_status_data.get('next_station')})\n"
                    f"ETA to Next Station: ~{train_status_data.get('eta_next_station_minutes')} mins\n"
                )
            except Exception as e:
                logger.warning("Could not fetch train context for %s: %s", target_train, e)

        # 2. Try Google Gemini API with strict timeout safeguard
        if self.api_key:
            try:
                gemini_reply = await asyncio.wait_for(
                    self._call_gemini(message, conversation_history, train_context_str, user_role),
                    timeout=3.5
                )
                if gemini_reply:
                    intent, action_data, suggestions = self._detect_intent(message, target_train, train_status_data)
                    return {
                        "reply": gemini_reply,
                        "source": f"Google Gemini ({self.model})",
                        "intent": intent,
                        "action_data": action_data,
                        "suggested_actions": suggestions,
                        "train_context": train_status_data
                    }
            except Exception as e:
                logger.warning("Gemini API call skipped or timed out (%s), switching to local safety rules engine.", e)

        # 3. Deterministic Local Safety Rules Engine Fallback
        return self._local_fallback(message, target_train, train_status_data)

    async def _call_gemini(
        self,
        message: str,
        conversation_history: List[Dict[str, str]],
        train_context_str: str,
        user_role: str
    ) -> Optional[str]:
        """
        Calls Gemini 1.5 Flash via REST API with chat context.
        """
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

        # Construct contents array with history
        contents = []
        
        # Add system context in first user message
        initial_prompt = f"{SYSTEM_INSTRUCTION}\nUser Role: {user_role}\n{train_context_str}"
        contents.append({
            "role": "user",
            "parts": [{"text": initial_prompt}]
        })
        contents.append({
            "role": "model",
            "parts": [{"text": "Understood. I am RailResQ AI, ready to assist passengers and operators with railway safety, real-time tracking, and emergency coordination."}]
        })

        # Add recent conversation turns (up to 6)
        for turn in conversation_history[-6:]:
            role = "user" if turn.get("role") == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": turn.get("content", "")}]
            })

        # Append current message
        contents.append({
            "role": "user",
            "parts": [{"text": message}]
        })

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 600
            }
        }

        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self.api_key
        }

        timeout_cfg = httpx.Timeout(6.0, connect=2.5)
        async with httpx.AsyncClient(timeout=timeout_cfg) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return text.strip()
            else:
                logger.warning("Gemini returned HTTP %s: %s", resp.status_code, resp.text[:200])

        return None

    def _detect_intent(self, message: str, target_train: Optional[str], train_status_data: Optional[Dict[str, Any]]):
        """
        Analyzes message for quick action buttons (e.g. File Incident, View Live Map).
        """
        m_lower = message.lower()

        # Emergency keywords
        is_medical = any(w in m_lower for w in ["heart", "chest", "unconscious", "fainted", "pain", "bleeding", "stroke", "medical", "doctor", "medicine", "दर्द", "बेहोश", "खून", "மருத்துவம்"])
        is_fire = any(w in m_lower for w in ["fire", "smoke", "burning", "sparks", "आग", "धुआं", "தீ", "புகை"])
        is_security = any(w in m_lower for w in ["fight", "theft", "stolen", "knife", "threat", "robbery", "chain", "मारपीट", "चोरी"])
        is_suspicious = any(w in m_lower for w in ["bomb", "suspicious", "unattended", "bag", "लावारिस", "குண்டு"])

        coach_match = re.search(r"\b([A-Za-z]\d{1,2}|S\d{1,2}|B\d{1,2}|M\d{1,2})\b", message)
        coach = coach_match.group(1).upper() if coach_match else "B1"

        if is_medical:
            return (
                "EMERGENCY_REPORT",
                {
                    "category": "Medical emergency",
                    "train_number": target_train or "12393",
                    "coach_number": coach,
                    "description": message
                },
                ["🚨 Submit Medical Incident to Control Room", "Track Train Location", "First Aid Steps"]
            )
        elif is_fire:
            return (
                "EMERGENCY_REPORT",
                {
                    "category": "Fire or smoke",
                    "train_number": target_train or "12393",
                    "coach_number": coach,
                    "description": message
                },
                ["🚨 Submit Fire Alert to Control Room", "Emergency Evacuation Guide", "Locate Extinguisher"]
            )
        elif is_security or is_suspicious:
            return (
                "EMERGENCY_REPORT",
                {
                    "category": "Security threat" if is_security else "Unattended suspicious object",
                    "train_number": target_train or "12393",
                    "coach_number": coach,
                    "description": message
                },
                ["🚨 Alert Railway Protection Force (RPF)", "Report Incident", "Safety Advice"]
            )
        elif target_train and ("status" in m_lower or "where" in m_lower or "delay" in m_lower or "running" in m_lower or "time" in m_lower):
            return (
                "TRAIN_STATUS",
                {"train_number": target_train},
                [f"View #{target_train} on Live Radar Map", "Check Station Schedule", "Report Incident on this Train"]
            )

        return (
            "GENERAL",
            None,
            ["Track Live Trains", "Report Emergency", "Safety Rules"]
        )

    def _local_fallback(self, message: str, target_train: Optional[str], train_status_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Deterministic, offline safety rules engine if Gemini API is unreachable.
        """
        m_lower = message.lower()
        intent, action_data, suggestions = self._detect_intent(message, target_train, train_status_data)

        # 1. Live train query
        if target_train and train_status_data:
            reply = (
                f"🚆 **Live Status for Train #{target_train} ({train_status_data.get('train_name')}):**\n"
                f"- **Current Speed:** {train_status_data.get('speed_kmph')} km/h\n"
                f"- **Punctuality:** {train_status_data.get('delay_status')} ({train_status_data.get('delay_minutes')} mins delay)\n"
                f"- **Next Halt:** {train_status_data.get('next_station_name')} ({train_status_data.get('next_station')})\n"
                f"- **ETA:** ~{train_status_data.get('eta_next_station_minutes')} minutes\n"
                f"- **Location Status:** {train_status_data.get('current_status')}\n\n"
                f"You can track this train moving live on the GIS radar map or submit an emergency report if assistance is required."
            )
            return {
                "reply": reply,
                "source": "RailResQ Local Railway Telemetry",
                "intent": intent,
                "action_data": action_data,
                "suggested_actions": suggestions,
                "train_context": train_status_data
            }

        # 2. Medical Emergency
        if intent == "EMERGENCY_REPORT" and action_data and action_data.get("category") == "Medical emergency":
            reply = (
                "🚨 **Medical Emergency Guidance:**\n"
                "1. Keep the passenger lying down with elevated head. Ensure adequate airflow.\n"
                "2. Do not offer food or liquids if the patient is dizzy or unconscious.\n"
                "3. Immediately alert the Coach Attendant / TTE.\n"
                "4. RailResQ has prepared an emergency dispatch report for you below. Click **'Submit Medical Incident'** to transmit it directly to the Railway Control Room for hospital trauma coordination at the next station."
            )
            return {
                "reply": reply,
                "source": "RailResQ Medical Protocol Engine",
                "intent": intent,
                "action_data": action_data,
                "suggested_actions": suggestions
            }

        # 3. Fire Emergency
        if intent == "EMERGENCY_REPORT" and action_data and action_data.get("category") == "Fire or smoke":
            reply = (
                "🔥 **Fire / Smoke Protocol:**\n"
                "1. Pull the emergency alarm chain immediately if safe to stop the train near a accessible location.\n"
                "2. Cover your mouth and nose with a damp cloth to avoid smoke inhalation.\n"
                "3. Move toward the adjoining coaches away from the fire.\n"
                "4. Use the coach fire extinguisher located near the vestibule doors.\n"
                "5. Click below to instantly broadcast an urgent fire alert to the Control Room."
            )
            return {
                "reply": reply,
                "source": "RailResQ Fire Safety Protocol",
                "intent": intent,
                "action_data": action_data,
                "suggested_actions": suggestions
            }

        # 4. Default Assistant Response
        reply = (
            "Hello! I am **RailResQ AI Assistant** powered by Google Gemini.\n\n"
            "I can help you with:\n"
            "• **Emergency First-Aid & Reporting:** Instant guidance for medical, fire, or security emergencies onboard.\n"
            "• **Live Train Running Status:** Ask *'Where is train 12393?'* or *'Status of 12301'* for real-time speed, delays, and ETA.\n"
            "• **Station Facilities:** Check hospital and emergency support at upcoming stations.\n\n"
            "How can I assist you right now?"
        )
        return {
            "reply": reply,
            "source": "RailResQ Safety Engine",
            "intent": "GENERAL",
            "action_data": None,
            "suggested_actions": ["Where is train 12393?", "Report Medical Emergency", "Fire Safety Protocol", "Open Live Map"]
        }


chatbot_service = RailResQChatbotService()
