from typing import Dict, Any, List


class PriorityAssessmentAgent:
    """
    Agent 2: Deterministic, rule-based priority engine.
    Ensures safety assessments do not rely on unpredictable LLM outputs.
    """

    CRITICAL_KEYWORDS = [
        "heart attack", "unconscious", "not breathing", "chest pain", "bleeding profusely",
        "fire", "smoke", "flames", "burning", "explosion", "bomb", "knife", "gun", "weapon",
        "assault", "derail", "बेहोश", "आग", "खून", "दिल का दौरा"
    ]

    HIGH_KEYWORDS = [
        "fainted", "vomiting", "fracture", "severe pain", "pregnant", "labour", "fight",
        "harassment", "robbery", "thief", "suspicious bag", "gas smell", "short circuit"
    ]

    MEDIUM_KEYWORDS = [
        "door jammed", "window broken", "water leak", "overcrowded", "light not working",
        "elderly assistance", "lost child"
    ]

    def evaluate_priority(self, category: str, description: str, extracted_entities: Dict[str, Any] = None) -> Dict[str, Any]:
        desc_lower = description.lower()
        rules_triggered: List[str] = []
        priority = "LOW"
        reasons: List[str] = []

        # Check Category baseline rules
        if category in ["Fire or smoke"]:
            priority = "CRITICAL"
            rules_triggered.append("RULE_CAT_FIRE_HAZARD")
            reasons.append("Active fire or smoke detected in train carriage")
        elif category in ["Security threat"]:
            priority = "HIGH"
            rules_triggered.append("RULE_CAT_SECURITY_ALERT")
            reasons.append("Security issue requires RPF / railway police intervention")
        elif category in ["Medical emergency"]:
            priority = "HIGH"
            rules_triggered.append("RULE_CAT_MEDICAL_ALERT")
            reasons.append("Passenger health emergency requires on-board or station medical triage")
        elif category in ["Unattended suspicious object"]:
            priority = "HIGH"
            rules_triggered.append("RULE_CAT_SUSPICIOUS_PACKAGE")
            reasons.append("Potential security hazard requiring bomb detection / RPF verification")

        # Evaluate keyword escalation rules
        for kw in self.CRITICAL_KEYWORDS:
            if kw in desc_lower:
                priority = "CRITICAL"
                rules_triggered.append(f"RULE_CRITICAL_KEYWORD_MATCH: '{kw}'")
                reasons.append(f"Critical emergency keyword '{kw}' found in incident report")
                break

        if priority != "CRITICAL":
            for kw in self.HIGH_KEYWORDS:
                if kw in desc_lower:
                    priority = "HIGH"
                    rules_triggered.append(f"RULE_HIGH_KEYWORD_MATCH: '{kw}'")
                    reasons.append(f"High severity indicator '{kw}' found")
                    break

        if priority not in ["CRITICAL", "HIGH"]:
            for kw in self.MEDIUM_KEYWORDS:
                if kw in desc_lower:
                    priority = "MEDIUM"
                    rules_triggered.append(f"RULE_MEDIUM_KEYWORD_MATCH: '{kw}'")
                    reasons.append(f"Standard operational concern '{kw}' identified")
                    break

        if not rules_triggered:
            rules_triggered.append("RULE_DEFAULT_BASELINE")
            reasons.append("No critical hazard rules triggered; categorized as standard LOW priority")

        return {
            "suggested_priority": priority,
            "rules_triggered": rules_triggered,
            "reasons": reasons,
            "requires_human_review": True,
            "assessment_engine": "deterministic_safety_rules_v1"
        }
