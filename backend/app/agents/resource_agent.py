import json
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.entities import ResponseResource, Station


CATEGORY_TO_RESOURCE_TYPE = {
    "Medical emergency": "Medical response team",
    "Fire or smoke": "Fire response team",
    "Security threat": "Security response team",
    "Unattended suspicious object": "Security response team",
    "Equipment failure": "Railway assistance team",
    "Passenger safety issue": "Station support team",
    "Other emergency": "Station support team",
}


class ResourceCoordinationAgent:
    """
    Agent 4: Inspects available registered emergency response units,
    matches specialized capabilities to incident requirements, and recommends optimal assignments.
    """

    def recommend_resources(
        self, 
        db: Session, 
        category: str, 
        preferred_station_id: int = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        target_type = CATEGORY_TO_RESOURCE_TYPE.get(category, "Station support team")
        
        query = db.query(ResponseResource).filter(
            ResponseResource.is_active == True,
            ResponseResource.availability_status == "AVAILABLE"
        )

        all_available = query.all()
        recommendations = []

        for res in all_available:
            score = 0
            match_factors = []

            # 1. Type Match (+50 points)
            if res.resource_type == target_type:
                score += 50
                match_factors.append(f"Specialized role match: {res.resource_type}")
            else:
                score += 20
                match_factors.append(f"Cross-functional support capability: {res.resource_type}")

            # 2. Station Match (+40 points)
            if preferred_station_id and res.station_id == preferred_station_id:
                score += 40
                match_factors.append("Station proximity: stationed at requested handover point")

            # 3. Availability (+10 points)
            score += 10
            match_factors.append("Current status: AVAILABLE for immediate deployment")

            station_name = res.station.station_name if res.station else f"Station #{res.station_id}"

            recommendations.append({
                "resource_id": res.id,
                "resource_code": res.resource_code,
                "resource_name": res.resource_name,
                "resource_type": res.resource_type,
                "station_id": res.station_id,
                "station_name": station_name,
                "contact": res.contact_information,
                "suitability_score": score,
                "recommendation_reasons": match_factors
            })

        # Sort descending by suitability score
        recommendations.sort(key=lambda x: x["suitability_score"], reverse=True)
        return recommendations[:limit]
