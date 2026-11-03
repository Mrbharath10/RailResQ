import re
import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.entities import Incident


def tokenize(text: str) -> set:
    words = re.findall(r'\b\w{3,}\b', text.lower())
    return set(words)


def jaccard_similarity(set1: set, set2: set) -> float:
    if not set1 or not set2:
        return 0.0
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    return float(intersection) / union if union > 0 else 0.0


class DuplicateDetectionAgent:
    """
    Agent 3: Detects duplicate emergency reports on the same train/coach within a recent time window.
    Never merges automatically — presents match evidence for operator review.
    """

    def find_potential_duplicates(self, db: Session, new_incident: Incident, time_window_minutes: int = 60) -> List[Dict[str, Any]]:
        # Find incidents on same train created within time window
        recent_cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=time_window_minutes)

        candidates = db.query(Incident).filter(
            Incident.train_number == new_incident.train_number,
            Incident.id != new_incident.id,
            Incident.created_at >= recent_cutoff
        ).all()

        duplicates = []
        new_tokens = tokenize(new_incident.description)

        for candidate in candidates:
            score = 0.0
            reasons = []

            # Exact train match (+0.25)
            score += 0.25
            reasons.append(f"Matching train number: {new_incident.train_number}")

            # Coach check (+0.30 if exact match, +0.15 if adjacent/unspecified)
            if new_incident.coach_number and candidate.coach_number:
                if new_incident.coach_number.strip().upper() == candidate.coach_number.strip().upper():
                    score += 0.30
                    reasons.append(f"Identical coach number: {new_incident.coach_number}")
                else:
                    reasons.append(f"Different coach ({new_incident.coach_number} vs {candidate.coach_number})")

            # Category check (+0.20 if same category)
            if new_incident.category == candidate.category:
                score += 0.20
                reasons.append(f"Same emergency category: {new_incident.category}")

            # Text similarity (+up to 0.25)
            candidate_tokens = tokenize(candidate.description)
            text_sim = jaccard_similarity(new_tokens, candidate_tokens)
            score += (text_sim * 0.25)
            reasons.append(f"Description vocabulary similarity: {int(text_sim * 100)}%")

            # Cap score at 1.0
            final_score = min(round(score, 2), 1.0)

            # Threshold for considering it a duplicate suggestion
            if final_score >= 0.50:
                duplicates.append({
                    "candidate_id": candidate.id,
                    "candidate_train": candidate.train_number,
                    "candidate_coach": candidate.coach_number,
                    "candidate_category": candidate.category,
                    "candidate_summary": candidate.ai_summary or candidate.description[:100],
                    "candidate_created_at": candidate.created_at.isoformat() if candidate.created_at else "",
                    "similarity_score": final_score,
                    "match_reasons": reasons
                })

        return duplicates
