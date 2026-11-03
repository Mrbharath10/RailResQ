import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from app.database.session import Base


def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(30), default="passenger", nullable=False)  # passenger, operator, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    incidents = relationship("Incident", back_populates="passenger", foreign_keys="Incident.passenger_id")


class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True)
    station_code = Column(String(20), unique=True, index=True, nullable=False)
    station_name = Column(String(150), nullable=False)
    division = Column(String(100), default="Northern")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    has_medical_facility = Column(Boolean, default=True)
    has_fire_support = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)

    resources = relationship("ResponseResource", back_populates="station")
    schedules = relationship("TrainSchedule", back_populates="station")


class TrainSchedule(Base):
    __tablename__ = "train_schedules"

    id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String(20), index=True, nullable=False)
    train_name = Column(String(150), nullable=False)
    journey_date = Column(String(30), default="Today")
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    sequence_number = Column(Integer, nullable=False)
    scheduled_arrival = Column(String(30), nullable=False)
    estimated_arrival = Column(String(30), nullable=False)
    distance_km = Column(Float, default=0.0)
    data_mode = Column(String(20), default="SIMULATED")  # SIMULATED or LIVE
    last_updated = Column(DateTime(timezone=True), default=utc_now)

    station = relationship("Station", back_populates="schedules")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    passenger_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    passenger_name = Column(String(120), default="Passenger")
    passenger_contact = Column(String(60), default="")
    train_number = Column(String(20), index=True, nullable=False)
    train_name = Column(String(150), default="")
    coach_number = Column(String(20), nullable=False)
    seat_number = Column(String(20), default="")
    description = Column(Text, nullable=False)
    category = Column(String(60), default="Other emergency")
    reported_language = Column(String(30), default="en")
    translated_text = Column(Text, default="")
    ai_summary = Column(Text, default="")
    ai_extracted_data = Column(Text, default="{}")  # JSON serialized string
    suggested_priority = Column(String(20), default="MEDIUM")  # CRITICAL, HIGH, MEDIUM, LOW
    approved_priority = Column(String(20), default="MEDIUM")
    priority_rules_triggered = Column(Text, default="[]")
    reported_location = Column(String(150), default="")
    current_station_code = Column(String(20), default="")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String(40), default="REPORTED")  # REPORTED, TRIAGED, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED
    image_url = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    passenger = relationship("User", back_populates="incidents", foreign_keys=[passenger_id])
    assignments = relationship("ResourceAssignment", back_populates="incident")
    handovers = relationship("HandoverRecommendation", back_populates="incident")


class ResponseResource(Base):
    __tablename__ = "response_resources"

    id = Column(Integer, primary_key=True, index=True)
    resource_code = Column(String(30), unique=True, index=True, nullable=False)
    resource_name = Column(String(150), nullable=False)
    resource_type = Column(String(80), nullable=False)  # Medical response team, Railway assistance team, Fire response team, Security response team, Station support team
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    capabilities = Column(Text, default="[]")  # JSON list
    contact_information = Column(String(120), default="Control Hotline Ext. 100")
    availability_status = Column(String(30), default="AVAILABLE")  # AVAILABLE, DISPATCHED, OFFLINE
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    station = relationship("Station", back_populates="resources")
    assignments = relationship("ResourceAssignment", back_populates="resource")


class ResourceAssignment(Base):
    __tablename__ = "resource_assignments"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    resource_id = Column(Integer, ForeignKey("response_resources.id"), nullable=False)
    assigned_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    assignment_status = Column(String(40), default="ASSIGNED")  # ASSIGNED, ACKNOWLEDGED, IN_PROGRESS, COMPLETED, OVERDUE, ESCALATION_RECOMMENDED
    assigned_at = Column(DateTime(timezone=True), default=utc_now)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    deadline_at = Column(DateTime(timezone=True), nullable=False)
    escalated_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, default="")

    incident = relationship("Incident", back_populates="assignments")
    resource = relationship("ResponseResource", back_populates="assignments")


class HandoverRecommendation(Base):
    __tablename__ = "handover_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    recommended_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    recommended_resource_id = Column(Integer, ForeignKey("response_resources.id"), nullable=True)
    recommendation_reason = Column(Text, nullable=False)
    eta_minutes = Column(Integer, default=15)
    data_source = Column(String(30), default="SIMULATED")
    confidence = Column(Float, default=0.85)
    approval_status = Column(String(30), default="PENDING")  # PENDING, APPROVED, REJECTED
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    incident = relationship("Incident", back_populates="handovers")
    station = relationship("Station")
    resource = relationship("ResponseResource")


class IncidentDuplicate(Base):
    __tablename__ = "incident_duplicates"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    possible_duplicate_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    similarity_score = Column(Float, nullable=False)
    match_reasons = Column(Text, default="")
    review_status = Column(String(40), default="PENDING_REVIEW")  # PENDING_REVIEW, CONFIRMED_DUPLICATE, REJECTED_DIFFERENT
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    incident = relationship("Incident", foreign_keys=[incident_id])
    possible_duplicate = relationship("Incident", foreign_keys=[possible_duplicate_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    target_role = Column(String(30), default="operator")
    incident_id = Column(Integer, nullable=True)
    message = Column(Text, nullable=False)
    notification_type = Column(String(40), default="ALERT")  # ALERT, OVERDUE, ASSIGNMENT, HANDOVER, STATUS
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, nullable=True)
    actor_name = Column(String(120), default="System")
    actor_role = Column(String(30), default="system")
    incident_id = Column(Integer, nullable=True)
    action = Column(String(100), nullable=False)
    previous_value = Column(Text, default="")
    new_value = Column(Text, default="")
    explanation = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), default=utc_now)


class PriorityRule(Base):
    __tablename__ = "priority_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_name = Column(String(120), nullable=False)
    category = Column(String(60), nullable=False)
    keywords = Column(Text, default="[]")  # JSON array
    assigned_priority = Column(String(20), default="HIGH")
    is_active = Column(Boolean, default=True)


class SystemConfig(Base):
    __tablename__ = "system_configs"

    id = Column(Integer, primary_key=True, index=True)
    config_key = Column(String(80), unique=True, index=True, nullable=False)
    config_value = Column(Text, nullable=False)
    description = Column(String(200), default="")


# Import Booking Entities to register on SQLAlchemy Base metadata
from app.models.booking_entities import (
    TrainCatalog,
    SeatInventory,
    Booking,
    BookingPassenger,
    PaymentRecord,
    PNRVerificationLog
)

# Import Super App Entities (Food, Grocery, Safety, Transport, Tourism, API Adapters)
from app.models.super_app_entities import (
    Restaurant,
    FoodItem,
    FoodOrder,
    GroceryProduct,
    GroceryOrder,
    EmergencyFacility,
    TransportVehicle,
    RideBooking,
    TouristPlace,
    SavedWishlistPlace,
    APIIntegrationAdapter
)
