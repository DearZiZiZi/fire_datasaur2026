import os
import uuid
import pandas as pd
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

# DB Config
DATABASE_URL = os.getenv("NEON_DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("NEON_DATABASE_URL is not set in .env")

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, connect_args={"ssl": True})
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

from database import Base
from models import BusinessUnit, Manager, Ticket, TicketEnrichment

CSV_DIR = "/Users/zhassulanzhulbarissov/Desktop/02. Hardware & Software company/05. Hackathon_DATASAUR26/THE F.I.R.E. CHALLENGE"

RANK_MAP = {
    "Главный специалист": 3,
    "Ведущий специалист": 2,
    "Специалист": 1
}

CITY_COORDS = {
    "Актау": (43.648, 51.172), "Актобе": (50.283, 57.166), "Алматы": (43.238, 76.889),
    "Астана": (51.160, 71.427), "Атырау": (47.094, 51.923), "Караганда": (49.806, 73.085),
    "Кокшетау": (53.283, 69.378), "Костанай": (53.214, 63.624), "Кызылорда": (44.839, 65.503),
    "Павлодар": (52.287, 76.967), "Петропавловск": (54.875, 69.126), "Тараз": (42.900, 71.366),
    "Уральск": (51.227, 51.366), "Усть-Каменогорск": (49.948, 82.610), "Шымкент": (42.341, 69.590)
}

async def seed():
    # Initialize tables (WARNING: This will align the remote schema with current models)
    async with engine.begin() as conn:
        print("--- Re-initializing Schema (Neon) ---")
        # SQL for Postgres to drop all with cascade
        await conn.execute(text("DROP TABLE IF EXISTS ticket_enrichment CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS round_robin_state CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS tickets CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS managers CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS business_units CASCADE"))
        
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_maker() as session:
        print("--- Seeding Business Units ---")
        bu_df = pd.read_csv(f"{CSV_DIR}/business_units.csv").fillna('')
        for _, row in bu_df.iterrows():
            office = row.get('Офис', row.iloc[0])
            address = row.get('Адрес', row.iloc[1])
            lat, lng = CITY_COORDS.get(office, (None, None))
            await session.execute(
                text("INSERT INTO business_units (office, address, lat, lng) VALUES (:o, :a, :lat, :lng) ON CONFLICT (office) DO NOTHING"),
                {"o": office, "a": address, "lat": lat, "lng": lng}
            )
        
        print("--- Seeding Managers ---")
        m_df = pd.read_csv(f"{CSV_DIR}/managers.csv").fillna('')
        for _, row in m_df.iterrows():
            full_name = row['ФИО']
            position = str(row['Должность ']).strip()
            office = row['Офис']
            skills = row['Навыки'] # Plain string
            workload = int(row['Количество обращений в работе'])
            rank = RANK_MAP.get(position, 1)

            await session.execute(
                text("""
                    INSERT INTO managers (full_name, position, position_rank, skills, business_unit, requests_in_progress)
                    VALUES (:name, :pos, :rank, :skills, :bu, :work)
                    ON CONFLICT DO NOTHING
                """),
                {"name": full_name, "pos": position, "rank": rank, "skills": skills, "bu": office, "work": workload}
            )

        print("--- Seeding Tickets ---")
        t_df = pd.read_csv(f"{CSV_DIR}/tickets.csv").fillna('')
        for _, row in t_df.iterrows():
            guid = row.get('GUID клиента', row.get('Customer GUID', os.urandom(8).hex()))
            desc = row.get('Описание ', row.get('Description', ''))
            seg = row.get('Сегмент клиента', row.get('Segment', 'Mass'))
            gender = row.get('Пол клиента', '')
            
            # Use GUID as ID for now
            t_id = guid
            
            await session.execute(
                text("""
                    INSERT INTO tickets (id, customer_guid, description, segment, gender)
                    VALUES (:id, :guid, :desc, :seg, :gender)
                    ON CONFLICT (customer_guid) DO NOTHING
                """),
                {"id": t_id, "guid": guid, "desc": desc, "seg": seg, "gender": gender}
            )
            
            # Initialize Enrichment
            await session.execute(
                text("""
                    INSERT INTO ticket_enrichment (ticket_id, processing_status)
                    VALUES (:id, 'pending')
                    ON CONFLICT (ticket_id) DO NOTHING
                """),
                {"id": t_id}
            )

        await session.commit()
        print("Seeding completed successfully!")

if __name__ == "__main__":
    try:
        asyncio.run(seed())
    except Exception as e:
        print(f"Error during seeding: {e}")
        import traceback
        traceback.print_exc()
