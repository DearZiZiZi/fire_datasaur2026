from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from database import get_db
from models import Manager, Ticket, TicketEnrichment
from schemas import ManagerResponse, TicketResponse
from routers.tickets import flatten_ticket

router = APIRouter(prefix="/api/managers", tags=["managers"])

@router.get("", response_model=List[ManagerResponse])
async def get_managers(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Manager))
    return res.scalars().all()

@router.get("/{full_name}/tickets", response_model=List[TicketResponse])
async def get_manager_tickets(full_name: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Ticket, TicketEnrichment)
        .join(TicketEnrichment, Ticket.customer_guid == TicketEnrichment.ticket_guid)
        .where(TicketEnrichment.assigned_manager_name == full_name)
        .order_by(TicketEnrichment.processed_at.desc().nullslast())
    )
    
    output = []
    for ticket, enrichment in res.all():
        output.append(flatten_ticket(ticket, enrichment))
    
    return output
