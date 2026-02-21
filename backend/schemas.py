from pydantic import BaseModel, ConfigDict
from typing import List, Optional
import datetime

class TicketBase(BaseModel):
    customer_guid: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    segment: Optional[str] = None
    description: Optional[str] = None
    attachments: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    street: Optional[str] = None
    house: Optional[str] = None

class TicketResponse(TicketBase):
    request_type: Optional[str] = None
    tone: Optional[str] = None
    priority_score: Optional[int] = None
    language: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_prepared_response: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    assigned_manager_name: Optional[str] = None
    assigned_office: Optional[str] = None
    assignment_warning: Optional[str] = None
    processed_at: Optional[datetime.datetime] = None
    processing_status: Optional[str] = 'pending'

    model_config = ConfigDict(from_attributes=True)

class ManagerBase(BaseModel):
    full_name: str
    position: str
    skills: str # Store as string in DB
    business_unit: Optional[str] = None
    requests_in_progress: int = 0

    model_config = ConfigDict(from_attributes=True)

class ManagerResponse(ManagerBase):
    model_config = ConfigDict(from_attributes=True)

class BusinessUnitBase(BaseModel):
    office: str
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class BusinessUnitResponse(BusinessUnitBase):
    model_config = ConfigDict(from_attributes=True)
