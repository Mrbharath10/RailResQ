import json
import datetime
from sqlalchemy.orm import Session
from app.database.session import Base, engine, SessionLocal
from app.models.entities import (
    User, Station, ResponseResource, TrainSchedule, PriorityRule,
    Incident, ResourceAssignment, HandoverRecommendation, IncidentDuplicate,
    Notification, AuditLog
)
from app.core.security import hash_password


def init_database():
    # Ensure all tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        now = datetime.datetime.now(datetime.timezone.utc)

        # 1. Seed Users
        if db.query(User).count() == 0:
            users = [
                User(
                    full_name="Control Room Operator",
                    email="operator@railresq.gov.in",
                    hashed_password=hash_password("operator123"),
                    role="operator",
                    is_active=True
                ),
                User(
                    full_name="Demo Passenger",
                    email="passenger@railresq.gov.in",
                    hashed_password=hash_password("passenger123"),
                    role="passenger",
                    is_active=True
                ),
                User(
                    full_name="System Administrator",
                    email="admin@railresq.gov.in",
                    hashed_password=hash_password("admin123"),
                    role="admin",
                    is_active=True
                ),
            ]
            db.add_all(users)
            db.commit()

        # 2. Seed Railway Stations
        if db.query(Station).count() == 0:
            stations = [
                Station(
                    station_code="NDLS",
                    station_name="New Delhi Railway Station",
                    division="Delhi",
                    latitude=28.6415,
                    longitude=77.2185,
                    has_medical_facility=True,
                    has_fire_support=True
                ),
                Station(
                    station_code="GZB",
                    station_name="Ghaziabad Junction",
                    division="Delhi",
                    latitude=28.6679,
                    longitude=77.4378,
                    has_medical_facility=True,
                    has_fire_support=True
                ),
                Station(
                    station_code="ALJN",
                    station_name="Aligarh Junction",
                    division="Prayagraj",
                    latitude=27.8974,
                    longitude=78.0880,
                    has_medical_facility=True,
                    has_fire_support=True
                ),
                Station(
                    station_code="CNB",
                    station_name="Kanpur Central",
                    division="Prayagraj",
                    latitude=26.4547,
                    longitude=80.3507,
                    has_medical_facility=True,
                    has_fire_support=True
                ),
                Station(
                    station_code="PRYJ",
                    station_name="Prayagraj Junction",
                    division="Prayagraj",
                    latitude=25.4484,
                    longitude=81.8333,
                    has_medical_facility=True,
                    has_fire_support=True
                ),
                Station(
                    station_code="DDU",
                    station_name="Pt. Deen Dayal Upadhyaya Junction",
                    division="DDU",
                    latitude=25.2818,
                    longitude=83.1189,
                    has_medical_facility=True,
                    has_fire_support=True
                ),
                Station(
                    station_code="BSB",
                    station_name="Varanasi Junction",
                    division="Lucknow",
                    latitude=25.3283,
                    longitude=82.9863,
                    has_medical_facility=True,
                    has_fire_support=True
                )
            ]
            db.add_all(stations)
            db.commit()

        # 3. Seed Specialized Response Resources
        if db.query(ResponseResource).count() == 0:
            cnb_station = db.query(Station).filter(Station.station_code == "CNB").first()
            pryj_station = db.query(Station).filter(Station.station_code == "PRYJ").first()
            aljn_station = db.query(Station).filter(Station.station_code == "ALJN").first()
            ndls_station = db.query(Station).filter(Station.station_code == "NDLS").first()

            resources = [
                ResponseResource(
                    resource_code="MED-CNB-01",
                    resource_name="Kanpur Central Rapid Trauma Unit",
                    resource_type="Medical response team",
                    station_id=cnb_station.id if cnb_station else 1,
                    capabilities=json.dumps(["Level-2 Trauma Care", "Mobile Oxygen", "Cardiac Defibrillator", "Ambulance On Standby"]),
                    contact_information="Hotline: +91 512 232001",
                    availability_status="AVAILABLE"
                ),
                ResponseResource(
                    resource_code="SEC-CNB-02",
                    resource_name="Kanpur Central RPF Escort Quick Reaction Team",
                    resource_type="Security response team",
                    station_id=cnb_station.id if cnb_station else 1,
                    capabilities=json.dumps(["Armed Escort", "Crowd Control", "Onboard Search", "Anti-Sabotage"]),
                    contact_information="RPF Control: 182",
                    availability_status="AVAILABLE"
                ),
                ResponseResource(
                    resource_code="FIRE-PRYJ-01",
                    resource_name="Prayagraj Railway Fire Tender Squad",
                    resource_type="Fire response team",
                    station_id=pryj_station.id if pryj_station else 1,
                    capabilities=json.dumps(["CO2 Foam Extinguishers", "Electrical Hazard Neutralization", "Smoke Evacuation Fans"]),
                    contact_information="Fire Hotline: 101 / +91 532 240001",
                    availability_status="AVAILABLE"
                ),
                ResponseResource(
                    resource_code="MED-PRYJ-02",
                    resource_name="Prayagraj Divisional Medical Brigade",
                    resource_type="Medical response team",
                    station_id=pryj_station.id if pryj_station else 1,
                    capabilities=json.dumps(["Paramedic Stretcher Squad", "Emergency Delivery Kit", "ICU Ambulance"]),
                    contact_information="Medical Post: +91 532 240099",
                    availability_status="AVAILABLE"
                ),
                ResponseResource(
                    resource_code="ENG-ALJN-01",
                    resource_name="Aligarh Mechanical & Electrical Assistance Squad",
                    resource_type="Railway assistance team",
                    station_id=aljn_station.id if aljn_station else 1,
                    capabilities=json.dumps(["AC Repair", "Brake Rigging Inspection", "Coach Vestibule Repair"]),
                    contact_information="Carriage & Wagon Depot Ext 44",
                    availability_status="AVAILABLE"
                ),
                ResponseResource(
                    resource_code="SUPP-NDLS-01",
                    resource_name="New Delhi Station Assistance & Passenger Support",
                    resource_type="Station support team",
                    station_id=ndls_station.id if ndls_station else 1,
                    capabilities=json.dumps(["Wheelchair Assistance", "Elderly Escort", "Platform Coordination"]),
                    contact_information="Station Supt: 139",
                    availability_status="AVAILABLE"
                ),
            ]
            db.add_all(resources)
            db.commit()

        # 4. Seed Priority Rules
        if db.query(PriorityRule).count() == 0:
            rules = [
                PriorityRule(
                    rule_name="Active Fire or Smoke In Coach",
                    category="Fire or smoke",
                    keywords=json.dumps(["fire", "smoke", "sparks", "burning"]),
                    assigned_priority="CRITICAL",
                    is_active=True
                ),
                PriorityRule(
                    rule_name="Life Threatening Medical Distress",
                    category="Medical emergency",
                    keywords=json.dumps(["unconscious", "heart attack", "chest pain", "bleeding"]),
                    assigned_priority="CRITICAL",
                    is_active=True
                ),
                PriorityRule(
                    rule_name="Violent Security Threat or Weapon",
                    category="Security threat",
                    keywords=json.dumps(["gun", "knife", "assault", "robbery"]),
                    assigned_priority="CRITICAL",
                    is_active=True
                ),
                PriorityRule(
                    rule_name="Unattended Suspicious Baggage",
                    category="Unattended suspicious object",
                    keywords=json.dumps(["bomb", "suspicious box", "explosive"]),
                    assigned_priority="HIGH",
                    is_active=True
                ),
            ]
            db.add_all(rules)
            db.commit()

        # 5. Pre-seed Operational Incidents so dashboard is immediately rich & demonstrable!
        if db.query(Incident).count() == 0:
            operator_user = db.query(User).filter(User.role == "operator").first()
            cnb = db.query(Station).filter(Station.station_code == "CNB").first()
            aljn = db.query(Station).filter(Station.station_code == "ALJN").first()
            pryj = db.query(Station).filter(Station.station_code == "PRYJ").first()
            med_res = db.query(ResponseResource).filter(ResponseResource.resource_code == "MED-CNB-01").first()
            fire_res = db.query(ResponseResource).filter(ResponseResource.resource_code == "FIRE-PRYJ-01").first()
            eng_res = db.query(ResponseResource).filter(ResponseResource.resource_code == "ENG-ALJN-01").first()

            inc1 = Incident(
                passenger_name="Ramesh Verma",
                passenger_contact="+91 98111 22334",
                train_number="12301",
                train_name="Howrah Rajdhani Express",
                coach_number="B4",
                seat_number="42",
                description="Elderly male passenger collapsed in berth 42. Severe chest pain, heavy breathing and profuse sweating. Needs immediate doctor and oxygen support on arrival.",
                category="Medical emergency",
                reported_language="en",
                ai_summary="[CRITICAL MEDICAL] Passenger collapsed with acute cardiac distress symptoms. Priority trauma unit required at next scheduled halt.",
                ai_extracted_data=json.dumps({
                    "severity_indicators": ["chest pain", "collapsed", "unconscious"],
                    "symptoms_or_hazards": ["breathing difficulty", "sweating"],
                    "immediate_risks": ["Potential myocardial infarction"],
                    "coach_or_location_details": "Coach B4, Berth 42"
                }),
                suggested_priority="CRITICAL",
                approved_priority="CRITICAL",
                priority_rules_triggered=json.dumps(["RULE_CRITICAL_KEYWORD_MATCH: 'chest pain'", "RULE_CAT_MEDICAL_ALERT"]),
                reported_location="Passing Fatehpur (Section km 512)",
                status="TRIAGED"
            )
            db.add(inc1)
            db.commit()
            db.refresh(inc1)

            # Handover recommendation for inc1
            h1 = HandoverRecommendation(
                incident_id=inc1.id,
                recommended_station_id=cnb.id if cnb else 1,
                recommended_resource_id=med_res.id if med_res else None,
                recommendation_reason="Next scheduled halt is Kanpur Central (CNB). Station equipped with Level-2 Trauma Care & ICU Ambulance on standby. Estimated arrival in 15 minutes.",
                eta_minutes=15,
                data_source="SIMULATED",
                confidence=0.92,
                approval_status="PENDING"
            )
            db.add(h1)

            # Incident 2: Fire/Smoke with Assigned Squad
            inc2 = Incident(
                passenger_name="Sunita Nair",
                passenger_contact="+91 97222 33445",
                train_number="12004",
                train_name="Lucknow Shatabdi Express",
                coach_number="C2",
                seat_number="18",
                description="Heavy smoke and pungent burning odor emanating from electrical junction panel near washroom in coach C2. Sparks visible.",
                category="Fire or smoke",
                reported_language="en",
                ai_summary="[FIRE / SMOKE HAZARD] Active electrical panel smoke and sparks reported inside coach C2. Immediate fire suppression dispatch required.",
                ai_extracted_data=json.dumps({
                    "severity_indicators": ["smoke", "burning", "sparks"],
                    "symptoms_or_hazards": ["electrical panel smoke"],
                    "immediate_risks": ["Coach fire escalation"],
                    "coach_or_location_details": "Coach C2 near washroom"
                }),
                suggested_priority="CRITICAL",
                approved_priority="CRITICAL",
                priority_rules_triggered=json.dumps(["RULE_CAT_FIRE_HAZARD", "RULE_CRITICAL_KEYWORD_MATCH: 'smoke'"]),
                reported_location="Approaching Aligarh Junction Outer",
                status="ASSIGNED"
            )
            db.add(inc2)
            db.commit()
            db.refresh(inc2)

            h2 = HandoverRecommendation(
                incident_id=inc2.id,
                recommended_station_id=aljn.id if aljn else 1,
                recommended_resource_id=eng_res.id if eng_res else None,
                recommendation_reason="Train approaching Aligarh Junction (ALJN). Mechanical & Electrical assistance squad alerted with CO2 extinguishers. Estimated arrival in 11 minutes.",
                eta_minutes=11,
                data_source="SIMULATED",
                confidence=0.95,
                approval_status="APPROVED",
                approved_by=operator_user.id if operator_user else 1,
                approved_at=now
            )
            db.add(h2)

            # Active assignment for inc2
            assign2 = ResourceAssignment(
                incident_id=inc2.id,
                resource_id=eng_res.id if eng_res else 1,
                assigned_by=operator_user.id if operator_user else 1,
                assignment_status="ASSIGNED",
                deadline_at=now + datetime.timedelta(minutes=4),
                notes="Dispatched to Platform 2 on train arrival."
            )
            db.add(assign2)

            # Incident 3: Security Altercation
            inc3 = Incident(
                passenger_name="Arun Kumar",
                passenger_contact="+91 99333 44556",
                train_number="22436",
                train_name="Vande Bharat Express",
                coach_number="C8",
                seat_number="25",
                description="Three unruly intoxicated passengers verbally abusing and physically threatening co-passengers with a pocket blade near vestibule.",
                category="Security threat",
                reported_language="en",
                ai_summary="[SECURITY THREAT] Physical altercation and weapon threat reported in coach C8. RPF tactical escort required on arrival.",
                ai_extracted_data=json.dumps({
                    "severity_indicators": ["threatening", "assaulting", "pocket blade"],
                    "symptoms_or_hazards": ["physical altercation"],
                    "immediate_risks": ["Passenger physical harm"],
                    "coach_or_location_details": "Coach C8 vestibule"
                }),
                suggested_priority="HIGH",
                approved_priority="HIGH",
                priority_rules_triggered=json.dumps(["RULE_CAT_SECURITY_ALERT"]),
                reported_location="Approaching Varanasi Junction",
                status="IN_PROGRESS"
            )
            db.add(inc3)
            db.commit()
            db.refresh(inc3)

            # Incident 4: Duplicate Report of Incident 1 for testing duplicate detection
            inc4 = Incident(
                passenger_name="Pooja Sen",
                passenger_contact="+91 98444 55667",
                train_number="12301",
                train_name="Howrah Rajdhani Express",
                coach_number="B4",
                seat_number="40",
                description="Old gentleman collapsed on floor near berth 40 in coach B4. Having chest pain and breathing issues. Please call ambulance immediately at next halt.",
                category="Medical emergency",
                reported_language="en",
                ai_summary="[MEDICAL EMERGENCY] Duplicate report of collapsed cardiac patient in coach B4.",
                ai_extracted_data=json.dumps({
                    "severity_indicators": ["chest pain", "collapsed"],
                    "symptoms_or_hazards": ["breathing difficulty"],
                    "immediate_risks": ["Cardiac collapse"]
                }),
                suggested_priority="CRITICAL",
                approved_priority="CRITICAL",
                priority_rules_triggered=json.dumps(["RULE_CRITICAL_KEYWORD_MATCH: 'chest pain'"]),
                reported_location="Passing Fatehpur",
                status="TRIAGED"
            )
            db.add(inc4)
            db.commit()
            db.refresh(inc4)

            # Add Duplicate Record linking inc1 and inc4 with 88% similarity
            dup_rec = IncidentDuplicate(
                incident_id=inc4.id,
                possible_duplicate_id=inc1.id,
                similarity_score=0.88,
                match_reasons=json.dumps([
                    "Matching train number: 12301",
                    "Identical coach number: B4",
                    "Same emergency category: Medical emergency",
                    "Description vocabulary similarity: 82%"
                ]),
                review_status="PENDING_REVIEW"
            )
            db.add(dup_rec)

            # Incident 5: Overdue Escalation Demonstration
            past_deadline = now - datetime.timedelta(minutes=8)
            inc5 = Incident(
                passenger_name="Gopal Krishnan",
                passenger_contact="+91 96555 66778",
                train_number="12004",
                train_name="Lucknow Shatabdi Express",
                coach_number="C5",
                seat_number="12",
                description="Passenger suffered scalding hot tea spill across hands and chest. Severe blistering burn requiring medical dressing.",
                category="Medical emergency",
                reported_language="en",
                ai_summary="[MEDICAL EMERGENCY] Scalding burn injury in coach C5. Response unit dispatch overdue for acknowledgement.",
                ai_extracted_data=json.dumps({
                    "severity_indicators": ["burn injury", "severe blistering"],
                    "immediate_risks": ["Infection and shock"]
                }),
                suggested_priority="HIGH",
                approved_priority="HIGH",
                priority_rules_triggered=json.dumps(["RULE_HIGH_KEYWORD_MATCH: 'severe pain'"]),
                reported_location="Ghaziabad Junction",
                status="ASSIGNED"
            )
            db.add(inc5)
            db.commit()
            db.refresh(inc5)

            assign5 = ResourceAssignment(
                incident_id=inc5.id,
                resource_id=med_res.id if med_res else 1,
                assigned_by=operator_user.id if operator_user else 1,
                assignment_status="OVERDUE",
                deadline_at=past_deadline,
                escalated_at=now,
                notes="Response squad did not acknowledge dispatch order within 5 minutes. Escalation recommended."
            )
            db.add(assign5)

            # Notifications
            notifs = [
                Notification(
                    target_role="operator",
                    incident_id=inc1.id,
                    message="NEW CRITICAL EMERGENCY: Train 12301 Coach B4 - Medical emergency. Handover recommended at Kanpur Central (CNB).",
                    notification_type="ALERT",
                    is_read=False
                ),
                Notification(
                    target_role="operator",
                    incident_id=inc5.id,
                    message="ESCALATION ALERT: Assigned response unit failed to acknowledge Incident #5 (Train 12004) within deadline. Urgent operator escalation recommended!",
                    notification_type="OVERDUE",
                    is_read=False
                ),
                Notification(
                    target_role="operator",
                    incident_id=inc4.id,
                    message="DUPLICATE DETECTED: Incident #4 matches active Incident #1 (88% similarity score). Operator review required.",
                    notification_type="ALERT",
                    is_read=False
                ),
            ]
            db.add_all(notifs)

            # Audit Trail
            audits = [
                AuditLog(
                    actor_name="Ramesh Verma",
                    actor_role="passenger",
                    incident_id=inc1.id,
                    action="INCIDENT_REPORTED_AND_TRIAGED",
                    new_value="Status: TRIAGED | Priority: CRITICAL",
                    explanation="Passenger reported emergency. Processed through AI Understanding & Deterministic Safety Rules."
                ),
                AuditLog(
                    actor_name="Control Room Operator",
                    actor_role="operator",
                    incident_id=inc2.id,
                    action="HANDOVER_RECOMMENDATION_APPROVED",
                    previous_value="PENDING",
                    new_value="APPROVED",
                    explanation="Operator confirmed station handover to Aligarh Junction (ALJN)."
                ),
                AuditLog(
                    actor_name="Acknowledgement Agent",
                    actor_role="agent",
                    incident_id=inc5.id,
                    action="ESCALATION_TRIGGERED",
                    previous_value="ASSIGNED",
                    new_value="OVERDUE",
                    explanation=f"Acknowledgement deadline expired at {past_deadline.isoformat()}. Escalation alert generated."
                ),
            ]
            db.add_all(audits)
            db.commit()

        # Seed Mock Railway Booking System (40 Trains, 35 Stations, Inventories & Demo PNRs)
        from app.database.seed_booking_data import seed_booking_system
        seed_booking_system(db)

        # Seed Complete AI Passenger Super App (Food, Grocery, Safety, Transport, Tourism, API Adapters)
        from app.database.seed_super_app_data import seed_super_app
        seed_super_app(db)

    finally:
        db.close()
