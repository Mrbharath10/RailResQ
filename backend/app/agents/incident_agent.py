import os
import json
import logging
import httpx
from typing import Dict, Any

from app.core.config import settings

logger = logging.getLogger("railresq.agents.incident")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", settings.GEMINI_API_KEY)

# Multilingual keywords dictionary for offline deterministic fallback
KEYWORD_RULES = {
    "Medical emergency": [
        "heart attack", "chest pain", "unconscious", "bleeding", "fainted", "breathing difficulty",
        "stroke", "seizure", "vomiting blood", "labour pain", "pregnant", "injured", "fracture",
        "दिल का दौरा", "बेहोश", "खून", "दर्द", "सांस", "चिकित्सा", "अस्पताल",
        "மாரடைப்பு", "மயக்கம்", "இரத்தம்", "நெஞ்சு வலி",
        "గుండెపోటు", "స్పృహతప్పడం", "రక్తం", "శ్వాస"
    ],
    "Fire or smoke": [
        "fire", "smoke", "burning", "sparks", "flames", "short circuit", "smell of burning",
        "आग", "धुआं", "जल रहा", "चिंगारी", "தீ", "புகை", "నిప్పు", "పొగ"
    ],
    "Security threat": [
        "fight", "weapon", "knife", "gun", "harassment", "robbery", "thief", "assault", "threat",
        "मारपीट", "हथियार", "चोरी", "धमकी", "தாக்குதல்", "திருட்டு", "తుపాకీ", "దాడులు"
    ],
    "Unattended suspicious object": [
        "bomb", "suspicious bag", "unattended box", "explosive", "abandoned luggage", "ticking",
        "लावारिस बैग", "संदिग्ध", "बम", "குண்டு", "సందేహాస్పద"
    ],
    "Equipment failure": [
        "ac not working", "fan broken", "door jammed", "window broken", "brake smell", "coupling noise",
        "एसी खराब", "बिजली बंद", "दरवाजा", "ఫ్యాన్", "తలుపు"
    ],
    "Passenger safety issue": [
        "overcrowding", "water leaking", "broken glass", "stampede risk", "falling risk",
        "भीड़", "पानी लीकेज", "கூட்டம்"
    ]
}


class IncidentUnderstandingAgent:
    """
    Agent 1: Understands emergency descriptions, translates non-English text,
    extracts structured entities, identifies missing info, and categorizes the incident.
    """

    async def analyze_incident(self, description: str, reported_category: str = "", language: str = "en") -> Dict[str, Any]:
        # Try Gemini API if key is present
        if GEMINI_API_KEY:
            try:
                ai_result = await self._call_gemini_api(description, reported_category, language)
                if ai_result:
                    return ai_result
            except Exception as e:
                logger.warning("Gemini API call failed, falling back to local NLP heuristic: %s", e)

        # Fallback Deterministic NLP Extraction Engine
        return self._local_nlp_extraction(description, reported_category, language)

    async def _call_gemini_api(self, description: str, reported_category: str, language: str) -> Dict[str, Any]:
        prompt = f"""
You are RailResQ's Incident Understanding Agent for railway emergency dispatch.
Analyze the following passenger emergency report.

Report: "{description}"
User Selected Category: "{reported_category}"
Reported Language: "{language}"

Output STRICTLY valid JSON with these keys:
{{
  "detected_language": "en or hi or ta, etc.",
  "translated_description": "English translation if non-English",
  "category": "Medical emergency | Fire or smoke | Security threat | Passenger safety issue | Equipment failure | Unattended suspicious object | Other emergency",
  "ai_summary": "Concise 1-2 sentence emergency dispatch summary",
  "extracted_entities": {{
    "severity_indicators": ["e.g. unconscious", "flames"],
    "symptoms_or_hazards": ["e.g. chest pain"],
    "immediate_risks": ["e.g. passenger collapse"],
    "coach_or_location_details": "Extracted location mentions"
  }},
  "missing_information": ["e.g. seat number if unspecified", "passenger age"],
  "ai_confidence": 0.95
}}
"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"}
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text_content = data["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(text_content)
        return None

    def _local_nlp_extraction(self, description: str, reported_category: str, language: str) -> Dict[str, Any]:
        desc_lower = description.lower()
        detected_category = reported_category or "Other emergency"
        severity_indicators = []
        symptoms_or_hazards = []

        # Category matching heuristic
        matched_scores = {}
        for cat, keywords in KEYWORD_RULES.items():
            score = 0
            for kw in keywords:
                if kw in desc_lower:
                    score += 1
                    severity_indicators.append(kw)
                    symptoms_or_hazards.append(kw)
            if score > 0:
                matched_scores[cat] = score

        if matched_scores:
            detected_category = max(matched_scores, key=matched_scores.get)

        # Missing information extraction
        missing_info = []
        if "seat" not in desc_lower and "berth" not in desc_lower:
            missing_info.append("Exact seat or berth number")
        if "age" not in desc_lower and "year old" not in desc_lower:
            missing_info.append("Affected passenger age/identity")
        if "phone" not in desc_lower and "contact" not in desc_lower:
            missing_info.append("Onboard companion direct contact number")

        # Generate summary
        summary = f"Reported {detected_category.lower()}: {description[:120]}..."
        if severity_indicators:
            summary = f"[{detected_category.upper()}] Passenger report highlights critical keywords ({', '.join(severity_indicators[:3])}). Immediate assistance recommended."

        return {
            "detected_language": language or "en",
            "translated_description": description,
            "category": detected_category,
            "ai_summary": summary,
            "extracted_entities": {
                "severity_indicators": list(set(severity_indicators)),
                "symptoms_or_hazards": list(set(symptoms_or_hazards)),
                "immediate_risks": [f"Potential escalation of {detected_category.lower()}"],
                "coach_or_location_details": "Extracted from train context"
            },
            "missing_information": missing_info,
            "ai_confidence": 0.90,
            "engine": "local_nlp_rule_agent"
        }
