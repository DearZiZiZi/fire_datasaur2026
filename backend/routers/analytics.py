from fastapi import APIRouter, Depends
from sqlalchemy.future import select
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List

from database import get_db
from models import Ticket, Manager, BusinessUnit, TicketEnrichment, OfficeEnrichment

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

async def fetch_overview(db: AsyncSession):
    # Total from core tickets
    total = await db.scalar(select(func.count(Ticket.customer_guid)))
    
    # Processed from enrichment
    processed = await db.scalar(select(func.count(TicketEnrichment.ticket_guid)).where(TicketEnrichment.processing_status == "done"))
    
    # Average priority from enrichment
    avg_priority = await db.scalar(select(func.avg(TicketEnrichment.priority_score)).where(TicketEnrichment.priority_score.isnot(None)))
    
    return {
        "total": total or 0,
        "processed": processed or 0,
        "pending": (total or 0) - (processed or 0),
        "avg_priority": round(float(avg_priority), 1) if avg_priority else 0.0
    }

async def fetch_by_type(db: AsyncSession):
    # From enrichment
    res = await db.execute(
        select(TicketEnrichment.request_type, func.count(TicketEnrichment.ticket_guid))
        .where(TicketEnrichment.request_type.isnot(None))
        .group_by(TicketEnrichment.request_type)
    )
    return [{"name": row[0], "value": row[1]} for row in res.all() if row[0]]

async def fetch_by_city(db: AsyncSession):
    # From core tickets (Населённый пункт mapped to city)
    res = await db.execute(
        select(Ticket.city, func.count(Ticket.customer_guid))
        .where(Ticket.city.isnot(None))
        .group_by(Ticket.city)
        .order_by(func.count(Ticket.customer_guid).desc())
        .limit(10)
    )
    return [{"name": row[0] or "Unknown", "value": row[1]} for row in res.all()]

async def fetch_by_tone(db: AsyncSession):
    # From enrichment
    res = await db.execute(
        select(TicketEnrichment.tone, func.count(TicketEnrichment.ticket_guid))
        .where(TicketEnrichment.tone.isnot(None))
        .group_by(TicketEnrichment.tone)
    )
    return [{"name": row[0], "value": row[1]} for row in res.all() if row[0]]

async def fetch_workload(db: AsyncSession):
    # From core managers
    res = await db.execute(
        select(Manager.full_name, Manager.requests_in_progress, Manager.business_unit)
        .order_by(Manager.requests_in_progress.desc())
    )
    return [{"name": row[0], "value": row[1], "office": row[2]} for row in res.all()]

async def fetch_priority_dist(db: AsyncSession):
    # From enrichment
    res = await db.execute(
        select(TicketEnrichment.priority_score, func.count(TicketEnrichment.ticket_guid))
        .where(TicketEnrichment.priority_score.isnot(None))
        .group_by(TicketEnrichment.priority_score)
        .order_by(TicketEnrichment.priority_score)
    )
    return [{"name": str(row[0]), "value": row[1]} for row in res.all()]

async def fetch_offices(db: AsyncSession):
    # Join BusinessUnit with OfficeEnrichment
    res = await db.execute(
        select(BusinessUnit.office, BusinessUnit.address, OfficeEnrichment.lat, OfficeEnrichment.lng)
        .outerjoin(OfficeEnrichment, BusinessUnit.office == OfficeEnrichment.office_name)
    )
    # Convert to list of objects compatible with get_offices response
    offices = []
    for row in res.all():
        offices.append({
            "office": row[0],
            "address": row[1],
            "lat": row[2] or 0.0,
            "lng": row[3] or 0.0
        })
    return offices

@router.get("/overview")
async def get_overview(db: AsyncSession = Depends(get_db)):
    return await fetch_overview(db)

@router.get("/by-type")
async def get_by_type(db: AsyncSession = Depends(get_db)):
    return await fetch_by_type(db)

@router.get("/by-city")
async def get_by_city(db: AsyncSession = Depends(get_db)):
    return await fetch_by_city(db)

@router.get("/by-tone")
async def get_by_tone(db: AsyncSession = Depends(get_db)):
    return await fetch_by_tone(db)

@router.get("/workload")
async def get_workload(db: AsyncSession = Depends(get_db)):
    return await fetch_workload(db)

@router.get("/priority")
async def get_priority_dist(db: AsyncSession = Depends(get_db)):
    return await fetch_priority_dist(db)

@router.get("/offices")
async def get_offices(db: AsyncSession = Depends(get_db)):
    offices = await fetch_offices(db)
    # Join with manager workload
    res = await db.execute(select(Manager.business_unit, func.sum(Manager.requests_in_progress)).group_by(Manager.business_unit))
    load_map = {row[0]: row[1] for row in res.all()}
    
    for o in offices:
        o["load"] = int(load_map.get(o["office"], 0))
        
    return offices
