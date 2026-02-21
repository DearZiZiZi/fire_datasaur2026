import asyncio
from typing import List
import datetime
from sqlalchemy.future import select
from sqlalchemy import func

from database import async_session_maker
from models import Ticket, Manager, BusinessUnit, TicketEnrichment, OfficeEnrichment
from services.geo_service import geocode_ticket
from services.ai_service import enrich_ticket_with_ai
from services.distribution import assign_ticket

class SSEManager:
    def __init__(self):
        self.queues: List[asyncio.Queue] = []

    async def broadcast(self, message: dict):
        for q in self.queues:
            await q.put(message)

sse_manager = SSEManager()

async def get_all_managers(db_session) -> List[Manager]:
    res = await db_session.execute(select(Manager))
    return list(res.scalars().all())

async def get_all_offices(db_session) -> List[dict]:
    # Join BusinessUnit with OfficeEnrichment
    res = await db_session.execute(
        select(BusinessUnit.office, OfficeEnrichment.lat, OfficeEnrichment.lng)
        .outerjoin(OfficeEnrichment, BusinessUnit.office == OfficeEnrichment.office_name)
    )
    return [{"office": row[0], "lat": row[1] or 0.0, "lng": row[2] or 0.0} for row in res.all()]

async def process_ticket(ticket_guid: str):
    async with async_session_maker() as db:
        # 1. Fetch core ticket info
        res = await db.execute(select(Ticket).where(Ticket.customer_guid == ticket_guid))
        ticket = res.scalar_one_or_none()
        if not ticket: return

        # 2. Get or create enrichment record
        res = await db.execute(select(TicketEnrichment).where(TicketEnrichment.ticket_guid == ticket_guid))
        enrichment = res.scalar_one_or_none()
        
        if not enrichment:
            enrichment = TicketEnrichment(ticket_guid=ticket_guid, processing_status='processing')
            db.add(enrichment)
        else:
            enrichment.processing_status = 'processing'
        
        await db.commit()

        try:
            # 1. Geocode
            lat, lng = await geocode_ticket(ticket.country, ticket.region, ticket.city, ticket.street, ticket.house)
            
            # 2. AI Enrichment
            ai_result = await enrich_ticket_with_ai(ticket.description or "", ticket.segment or "Mass")
            
            # 3. Distribution
            managers = await get_all_managers(db)
            offices = await get_all_offices(db)
            
            ticket_data = {
                'lat': lat, 'lng': lng,
                'country': ticket.country,
                'request_type': ai_result.request_type,
                'language': ai_result.language,
                'segment': ticket.segment
            }
            
            assigned_manager, office, warning = await assign_ticket(ticket_data, managers, offices, db)
            
            # 4. Save to Enrichment Table
            enrichment.lat = lat
            enrichment.lng = lng
            enrichment.request_type = ai_result.request_type
            enrichment.tone = ai_result.tone
            enrichment.priority_score = ai_result.priority_score
            enrichment.language = ai_result.language
            enrichment.ai_summary = ai_result.ai_summary
            enrichment.ai_prepared_response = ai_result.ai_prepared_response
            enrichment.assigned_manager_name = assigned_manager.full_name
            enrichment.assigned_office = office
            enrichment.assignment_warning = warning
            enrichment.processing_status = 'done'
            enrichment.processed_at = datetime.datetime.utcnow()
            
            await db.commit()
            
            # 5. Emit SSE
            await sse_manager.broadcast({
                'ticket_guid': ticket.customer_guid,
                'status': 'done',
                'manager': assigned_manager.full_name,
                'office': office,
                'priority': enrichment.priority_score,
                'warning': warning
            })
            
        except Exception as e:
            # Refresh enrichment instance
            res = await db.execute(select(TicketEnrichment).where(TicketEnrichment.ticket_guid == ticket_guid))
            enrichment = res.scalar_one_or_none()
            if enrichment:
                enrichment.processing_status = 'error'
                await db.commit()
            
            await sse_manager.broadcast({
                'ticket_guid': ticket_guid,
                'status': 'error',
                'error': str(e)
            })

async def process_all_pending(batch_size=5):
    async with async_session_maker() as db:
        # PENDING = In Ticket but NOT in TicketEnrichment, OR in TicketEnrichment with 'pending'
        # To keep it simple, find all tickets and check enrichment
        res = await db.execute(select(Ticket.customer_guid))
        all_guids = [row[0] for row in res.all()]
        
        # Filter for those that aren't 'done'
        res = await db.execute(select(TicketEnrichment.ticket_guid).where(TicketEnrichment.processing_status == 'done'))
        done_guids = set(row[0] for row in res.all())
        
        pending_guids = [g for g in all_guids if g not in done_guids]
        
    for i in range(0, len(pending_guids), batch_size):
        batch = pending_guids[i:i+batch_size]
        await asyncio.gather(*[process_ticket(guid) for guid in batch])
