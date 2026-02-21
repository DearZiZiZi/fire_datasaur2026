from fastapi import APIRouter, Depends, Query, BackgroundTasks, HTTPException
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import asyncio

from database import get_db
from models import Ticket, TicketEnrichment
from schemas import TicketResponse
from services.pipeline import process_all_pending, sse_manager
from sse_starlette.sse import EventSourceResponse

router = APIRouter(prefix="/api/tickets", tags=["tickets"])

def flatten_ticket(ticket, enrichment):
    data = {}
    # Core ticket fields
    data['customer_guid'] = ticket.customer_guid
    data['gender'] = ticket.gender
    data['date_of_birth'] = ticket.date_of_birth
    data['segment'] = ticket.segment
    data['description'] = ticket.description
    data['attachments'] = ticket.attachments
    data['country'] = ticket.country
    data['region'] = ticket.region
    data['city'] = ticket.city
    data['street'] = ticket.street
    data['house'] = ticket.house
    
    # Enrichment fields
    if enrichment:
        data.update({
            'request_type': enrichment.request_type,
            'tone': enrichment.tone,
            'priority_score': enrichment.priority_score,
            'language': enrichment.language,
            'ai_summary': enrichment.ai_summary,
            'ai_prepared_response': enrichment.ai_prepared_response,
            'lat': enrichment.lat,
            'lng': enrichment.lng,
            'assigned_manager_name': enrichment.assigned_manager_name,
            'assigned_office': enrichment.assigned_office,
            'assignment_warning': enrichment.assignment_warning,
            'processed_at': enrichment.processed_at,
            'processing_status': enrichment.processing_status
        })
    else:
        data['processing_status'] = 'pending'
    
    return data

@router.get("", response_model=List[TicketResponse])
async def get_tickets(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    db: AsyncSession = Depends(get_db)
):
    # Left join to include tickets without enrichment yet
    res = await db.execute(
        select(Ticket, TicketEnrichment)
        .outerjoin(TicketEnrichment, Ticket.customer_guid == TicketEnrichment.ticket_guid)
        .order_by(TicketEnrichment.processed_at.desc().nullslast())
        .offset(skip)
        .limit(limit)
    )
    
    output = []
    for ticket, enrichment in res.all():
        output.append(flatten_ticket(ticket, enrichment))
    
    return output

@router.get("/stream-status")
async def stream_status():
    async def event_publisher():
        q = asyncio.Queue()
        sse_manager.queues.append(q)
        try:
            while True:
                msg = await q.get()
                yield dict(data=msg)
        except asyncio.CancelledError:
            sse_manager.queues.remove(q)

    return EventSourceResponse(event_publisher())

@router.get("/{ticket_guid}", response_model=TicketResponse)
async def get_ticket(ticket_guid: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Ticket, TicketEnrichment)
        .outerjoin(TicketEnrichment, Ticket.customer_guid == TicketEnrichment.ticket_guid)
        .where(Ticket.customer_guid == ticket_guid)
    )
    row = res.one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    return flatten_ticket(row[0], row[1])

@router.post("/process-all")
async def trigger_process_all(background_tasks: BackgroundTasks):
    background_tasks.add_task(process_all_pending, batch_size=5)
    return {"message": "Processing started in background."}
