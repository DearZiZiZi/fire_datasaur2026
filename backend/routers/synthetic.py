import random
import uuid
import asyncio
from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import Ticket
from services.pipeline import process_all_pending

router = APIRouter(prefix="/api/synthetic", tags=["synthetic"])

# Full list of 15 KZ cities from prompt/business_units.csv
CITIES = [
    "Актау", "Актобе", "Алматы", "Астана", "Атырау", 
    "Караганда", "Кокшетау", "Костанай", "Кызылорда", 
    "Павлодар", "Петропавловск", "Тараз", "Уральск", 
    "Усть-Каменогорск", "Шымкент"
]

DESCRIPTIONS_RU = [
    "Не могу войти в приложение, постоянно пишет ошибка 500.",
    "Верните мои деньги! Я совершил перевод, но он не дошел.",
    "Как открыть инвестиционный счет для нерезидента?",
    "Я хочу изменить свой номер телефона в профиле.",
    "Подозрительная транзакция на моем счету! Я ее не совершал.",
    "Вы не имеете права блокировать мой аккаунт без объяснения!",
    "Это возмутительно! Почему поддержка молчит уже третий день?",
    "Здравствуйте, подскажите курс доллара на сегодня в отделении."
]

DESCRIPTIONS_KZ = [
    "Менде есептік жазба бұғатталған, көмектесіңізші.",
    "Қолданба жұмыс істемейді, СМС код келмейді.",
    "Жаңа шот ашу керек, қандай құжаттар қажет?",
    "Men ruyxatdan utolmayapman, техникалық қате шығып тұр.",
    "Ақшамды қайтарыңыз! Транзакция сәтсіз аяқталды."
]

DESCRIPTIONS_ENG = [
    "I cannot access my account after the last update.",
    "Please help me reset my password, the link is expired.",
    "Where is my money? The transfer is still pending after 48 hours.",
    "I suspect fraud on my account. There are transactions I didn't authorize.",
    "Highly professional support, thank you for your help!"
]

@router.post("/generate")
async def generate_synthetic_tickets(count: int = Body(..., embed=True), db: AsyncSession = Depends(get_db)):
    new_tickets = []
    for _ in range(count):
        # 1. Determine language/desc (RU 60%, KZ 25%, ENG 15%)
        lang_roll = random.random()
        if lang_roll < 0.6:
            desc = random.choice(DESCRIPTIONS_RU)
        elif lang_roll < 0.85:
            desc = random.choice(DESCRIPTIONS_KZ)
        else:
            desc = random.choice(DESCRIPTIONS_ENG)

        # 2. Determine segment (Mass 60%, VIP 25%, Priority 15%)
        seg_roll = random.random()
        if seg_roll < 0.6:
            seg = "Mass"
        elif seg_roll < 0.85:
            seg = "VIP"
        else:
            seg = "Priority"

        # 3. Determine city/country (95% KZ, 5% Foreign)
        city_roll = random.random()
        if city_roll < 0.95:
            country = "Казахстан"
            city = random.choice(CITIES)
        else:
            country = random.choice(["Россия", "Узбекистан", "UK", "USA", "Azerbaijan"])
            city = "Foreign Territory"

        # 4. Handle specific edge cases randomly
        # Case: "Изменение данных"
        if random.random() < 0.1:
            desc = "Я хочу изменить свой номер телефона и почту."
            
        # Case: "Мошенничество" / Fraud
        if random.random() < 0.05:
            desc = "МОШЕННИКИ! У меня украли деньги с карты!"
            
        ticket = Ticket(
            id=uuid.uuid4(),
            customer_guid=str(uuid.uuid4())[:18],
            segment=seg,
            description=desc,
            country=country,
            city=city,
            processing_status="pending"
        )
        db.add(ticket)
        new_tickets.append(ticket)
        
    await db.commit()
    
    # Trigger pipeline
    asyncio.create_task(process_all_pending(batch_size=5))
    
    return {"message": f"Generated {count} synthetic tickets and started background processing."}
