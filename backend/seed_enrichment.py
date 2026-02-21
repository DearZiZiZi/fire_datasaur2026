import asyncio
import os
import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text, select
from dotenv import load_dotenv

import sys
sys.path.append(os.getcwd())

from models import Base, OfficeEnrichment, Ticket, TicketEnrichment

CITY_COORDS = {
    'Алматы': (43.2389, 76.8897),
    'Астана': (51.1694, 71.4491),
    'Шымкент': (42.3417, 69.5901),
    'Актобе': (50.2839, 57.1669),
    'Караганда': (49.8019, 73.1021),
    'Тараз': (42.9011, 71.3783),
    'Павлодар': (52.2873, 76.9674),
    'Усть-Каменогорск': (49.9482, 82.6285),
    'Семей': (50.4111, 80.2223),
    'Атырау': (47.0945, 51.9168),
    'Костанай': (53.2144, 63.6246),
    'Кызылорда': (44.8488, 65.4823),
    'Уральск': (51.2333, 51.3667),
    'Петропавловск': (54.8753, 69.1628),
    'Актау': (43.6481, 51.1722),
    'Кокшетау': (53.2833, 69.3833),
}

async def seed_neon_enrichment():
    load_dotenv()
    url = os.environ.get('NEON_DATABASE_URL')
    engine = create_async_engine(url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        # Create supplementary tables if not exist
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # 1. Seed OfficeEnrichment
        print("Seeding OfficeEnrichment...")
        for city, (lat, lng) in CITY_COORDS.items():
            # Check if exists
            res = await session.execute(select(OfficeEnrichment).where(OfficeEnrichment.office_name == city))
            existing = res.scalar_one_or_none()
            if not existing:
                session.add(OfficeEnrichment(office_name=city, lat=lat, lng=lng))
        
        # 2. Initialize TicketEnrichment for all tickets that don't have it
        print("Initializing TicketEnrichment...")
        res = await session.execute(select(Ticket.customer_guid))
        all_guids = [row[0] for row in res.all()]
        
        for guid in all_guids:
            res = await session.execute(select(TicketEnrichment).where(TicketEnrichment.ticket_guid == guid))
            existing = res.scalar_one_or_none()
            if not existing:
                session.add(TicketEnrichment(ticket_guid=guid, processing_status='pending'))
        
        await session.commit()
        print("Seeding completed successfully.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_neon_enrichment())
