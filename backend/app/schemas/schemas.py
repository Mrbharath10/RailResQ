from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime


# Auth & User Schemas
class UserRegister(BaseModel):
    full_name: str
    email: str
    password: str
    role: Optional[str] = "passenger"


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# Incident Schemas
class IncidentCreate(BaseModel):
    train_number: str
    train_name: Optional[str] = ""
    coach_number: str
    seat_number: Optional[str] = ""
    description: str
    category: Optional[str] = "Other emergency"
    reported_location: Optional[str] = ""
    current_station_code: Optional[str] = ""
    reported_language: Optional[str] = "en"
    image_url: Optional[str] = None
    passenger_name: Optional[str] = "Passenger"
    passenger_contact: Optional[str] = ""


class IncidentUpdate(BaseModel):
    category: Optional[str] = None
    approved_priority: Optional[str] = None
    status: Optional[str] = None
    reported_location: Optional[str] = None
    explanation: Optional[str] = "Operator updated incident"


class IncidentStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = ""


# Resource Schemas
class ResourceCreate(BaseModel):
    resource_code: str
    resource_name: str
    resource_type: str
    station_id: int
    capabilities: Optional[List[str]] = []
    contact_information: Optional[str] = "Hotline"
    availability_status: Optional[str] = "AVAILABLE"


class ResourceUpdate(BaseModel):
    resource_name: Optional[str] = None
    resource_type: Optional[str] = None
    availability_status: Optional[str] = None
    is_active: Optional[bool] = None


# Assignment Schemas
class AssignmentCreate(BaseModel):
    incident_id: int
    resource_id: int
    deadline_minutes: Optional[int] = 5
    notes: Optional[str] = ""


# Handover Schemas
class HandoverRecommendRequest(BaseModel):
    incident_id: int


class HandoverApproveRequest(BaseModel):
    recommendation_id: int
    action: str = "APPROVE"  # APPROVE or REJECT
    notes: Optional[str] = ""


# Duplicate Review Schema
class DuplicateReviewRequest(BaseModel):
    duplicate_record_id: int
    review_status: str  # CONFIRMED_DUPLICATE or REJECTED_DIFFERENT
    notes: Optional[str] = ""


# Simulator Schema
class ScenarioRunRequest(BaseModel):
    scenario_id: str
