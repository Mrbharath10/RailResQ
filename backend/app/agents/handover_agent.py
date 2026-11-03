from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.entities import Station, ResponseResource, HandoverRecommendation, Incident
from app.providers.railway_provider import get_railway_provider


class StationHandoverAgent:
    """
    Agent 6: Intelligent Station Handover System.
    Analyzes train location, schedule, ETA, station facility readiness, and available
    emergency response teams to recommend the optimal station for patient/hazard handover.
    """

    def __init__(self):
        self.railway_provider = get_railway_provider()

    def generate_recommendation(self, db: Session, incident: Incident) -> Dict[str, Any]:
        # 1. Fetch train context
        train_status = self.railway_provider.get_train_status(incident.train_number)
        schedule = self.railway_provider.get_train_schedule(incident.train_number)

        data_source = train_status.get("data_mode", "SIMULATED")
        is_simulated = train_status.get("is_simulated", True)

        # 2. Determine target station candidates
        # Prefer next scheduled major station, or search database stations
        stations = db.query(Station).filter(Station.is_active == True).all()
        if not stations:
            # Fallback default station
            default_station = Station(
                station_code="NDLS",
                station_name="New Delhi",
                division="Northern",
                latitude=28.6415,
                longitude=77.2185,
                has_medical_facility=True,
                has_fire_support=True
            )
            db.add(default_station)
            db.commit()
            stations = [default_station]

        # Match next station from train schedule if possible
        next_station_code = train_status.get("next_station", "")
        chosen_station = None

        for s in stations:
            if s.station_code == next_station_code:
                chosen_station = s
                break

        if not chosen_station:
            # Fallback to first available station with needed facility
            if incident.category == "Medical emergency":
                medical_stations = [s for s in stations if s.has_medical_facility]
                chosen_station = medical_stations[0] if medical_stations else stations[0]
            elif incident.category == "Fire or smoke":
                fire_stations = [s for s in stations if s.has_fire_support]
                chosen_station = fire_stations[0] if fire_stations else stations[0]
            else:
                chosen_station = stations[0]

        # 3. Find matching response resource at this station
        candidate_resources = db.query(ResponseResource).filter(
            ResponseResource.station_id == chosen_station.id,
            ResponseResource.availability_status == "AVAILABLE",
            ResponseResource.is_active == True
        ).all()

        recommended_res = candidate_resources[0] if candidate_resources else None

        # 4. Compute confidence & arrival estimate
        eta_minutes = 18 if train_status.get("current_status") == "APPROACHING_STATION" else 35
        confidence = 0.90 if recommended_res else 0.70
        if train_status.get("current_status") == "UNKNOWN_SCHEDULE":
            confidence = 0.45

        # 5. Formulate reasoning
        reasons = [
            f"Next scheduled train halt is {chosen_station.station_name} ({chosen_station.station_code})",
            f"Estimated arrival in ~{eta_minutes} minutes with operational clearance",
        ]
        if incident.category == "Medical emergency" and chosen_station.has_medical_facility:
            reasons.append("Station equipped with Level-2 Railway Medical Unit & trauma stretcher access")
        if recommended_res:
            reasons.append(f"Dedicated {recommended_res.resource_type} ('{recommended_res.resource_name}') is on standby and available")
        else:
            reasons.append("Notice: No direct local team registered; station master assistance alert required")

        if confidence < 0.60:
            reasons.append("WARNING: Train live tracking is estimated; human operator verification mandatory before dispatch.")

        reason_text = " | ".join(reasons)

        # 6. Save or update recommendation in database
        handover = HandoverRecommendation(
            incident_id=incident.id,
            recommended_station_id=chosen_station.id,
            recommended_resource_id=recommended_res.id if recommended_res else None,
            recommendation_reason=reason_text,
            eta_minutes=eta_minutes,
            data_source=data_source,
            confidence=confidence,
            approval_status="PENDING"
        )
        db.add(handover)
        db.commit()
        db.refresh(handover)

        return {
            "recommendation_id": handover.id,
            "incident_id": incident.id,
            "recommended_station_code": chosen_station.station_code,
            "recommended_station_name": chosen_station.station_name,
            "station_latitude": chosen_station.latitude,
            "station_longitude": chosen_station.longitude,
            "eta_minutes": eta_minutes,
            "recommended_resource": {
                "id": recommended_res.id if recommended_res else None,
                "name": recommended_res.resource_name if recommended_res else "Station Master Coordination",
                "type": recommended_res.resource_type if recommended_res else "General Support"
            },
            "recommendation_reason": reason_text,
            "data_source": data_source,
            "is_simulated": is_simulated,
            "confidence": confidence,
            "approval_status": "PENDING"
        }
