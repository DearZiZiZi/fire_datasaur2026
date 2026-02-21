import uuid
import datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, ForeignKey, CheckConstraint, Computed, text, PrimaryKeyConstraint
from sqlalchemy.dialects.postgresql import ARRAY, UUID as PG_UUID
from database import Base

class BusinessUnit(Base):
    __tablename__ = "business_units"
    office = Column("офис", String, primary_key=True)
    address = Column("адрес", String)

class Manager(Base):
    __tablename__ = "managers"
    full_name = Column("фио", String, primary_key=True)
    position = Column("должность_", String, nullable=False)
    skills = Column("навыки", String, nullable=False)
    business_unit = Column("офис", String, primary_key=True) # Linked to business_units.офис
    requests_in_progress = Column("количество_обращений_в_работе", Integer, default=0)
    
    __table_args__ = (
        PrimaryKeyConstraint("фио", "офис"),
    )

class Ticket(Base):
    __tablename__ = "tickets"
    customer_guid = Column("GUID клиента", String, primary_key=True)
    gender = Column("Пол клиента", String)
    date_of_birth = Column("Дата рождения", String)
    description = Column("Описание", Text)
    attachments = Column("Вложения", Text)
    segment = Column("Сегмент клиента", String)
    country = Column("Страна", String)
    region = Column("Область", String)
    city = Column("Населённый пункт", String)
    street = Column("Улица", String)
    house = Column("Дом", String)

class TicketEnrichment(Base):
    __tablename__ = "ticket_enrichment"
    ticket_guid = Column(String, primary_key=True) # Logical link to tickets.customer_guid
    
    # AI Enrichment
    request_type = Column(String)
    tone = Column(String)
    priority_score = Column(Integer)
    language = Column(String)
    ai_summary = Column(Text)
    ai_prepared_response = Column(Text)
    
    # Geocoding Results
    lat = Column(Float)
    lng = Column(Float)

    # Assignment
    assigned_manager_name = Column(String)
    assigned_office = Column(String)
    assignment_warning = Column(Text)

    # Metadata
    processed_at = Column(DateTime, default=datetime.datetime.utcnow)
    processing_status = Column(String, default='pending')

class OfficeEnrichment(Base):
    __tablename__ = "office_enrichment"
    office_name = Column(String, primary_key=True) # Logical link to business_units.офис
    lat = Column(Float)
    lng = Column(Float)

class RoundRobinState(Base):
    __tablename__ = "round_robin_state"
    office = Column(String, primary_key=True)
    last_manager_name = Column(String)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
