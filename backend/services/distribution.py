import pandas as pd
import datetime
from typing import List, Tuple, Optional
from models import Manager, RoundRobinState
from services.geo_service import find_nearest_office
from sqlalchemy.future import select
import re

city_to_region = {
    "актау": "мангистауская",
    "актобе": "актюбинская",
    "алматы": "алматы",
    "астана": "астана",
    "атырау": "атырауская",
    "караганда": "карагандинская",
    "кокшетау": "акмолинская",
    "костанай": "костанайская",
    "кызылорда": "кызылординская",
    "павлодар": "павлодарская",
    "петропавловск": "северо-казахстанская",
    "тараз": "жамбылская",
    "уральск": "западно-казахстанская",
    "усть-каменогорск": "восточно-казахстанская",
    "шымкент": "шымкент"
}
region_to_office = {v: k for k, v in city_to_region.items()}

def normalize_text(text: str) -> str:
    if text is None or (isinstance(text, float) and str(text) == 'nan'):
        return ""
    text = str(text).lower().strip()
    text = re.sub(r"[^\w\s-]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text

async def get_foreign_office_rr(db_session) -> str:
    # 50/50 alternating between Астана and Алматы
    res = await db_session.execute(select(RoundRobinState).where(RoundRobinState.office == "FOREIGN_FALLBACK"))
    state = res.scalar_one_or_none()
    
    if not state:
        new_state = RoundRobinState(office="FOREIGN_FALLBACK", last_manager_name="1") # Mock name for toggle
        db_session.add(new_state)
        await db_session.commit()
        return "Астана"
    
    if state.last_manager_name == "1":
        state.last_manager_name = "2"
        await db_session.commit()
        return "Алматы"
    else:
        state.last_manager_name = "1"
        await db_session.commit()
        return "Астана"

def parse_skills(skills_str: str) -> List[str]:
    if not skills_str: return []
    # Strip brackets and split by comma
    cleaned = skills_str.strip('{}[]() ')
    return [s.strip().strip("'\"") for s in cleaned.split(',') if s.strip()]

async def assign_ticket(ticket_data: dict, all_managers: List[Manager], offices: List[dict], db_session) -> Tuple[Manager, str, Optional[str]]:

    # 1. Office assignment logic
    lat, lng = ticket_data.get('lat'), ticket_data.get('lng')
    country = normalize_text(ticket_data.get('country'))
    region = normalize_text(ticket_data.get('region'))
    city = normalize_text(ticket_data.get('city'))
    life_point = city
    assigned_office = None

    def choose_less_loaded_core_office():
        # Astana/Almaty fallback: choose less loaded
        astana_load = sum(m.requests_in_progress for m in all_managers if normalize_text(m.business_unit) == 'астана')
        almaty_load = sum(m.requests_in_progress for m in all_managers if normalize_text(m.business_unit) == 'алматы')
        return 'Астана' if astana_load <= almaty_load else 'Алматы'

    # If not Kazakhstan or missing/invalid coords, fallback
    if country and country != 'казахстан':
        assigned_office = choose_less_loaded_core_office()
    elif lat is None or lng is None:
        assigned_office = choose_less_loaded_core_office()
    else:
        # Try to find nearest office
        assigned_office = find_nearest_office(lat, lng, offices)
        if not assigned_office:
            assigned_office = choose_less_loaded_core_office()
        else:
            # full-match by city
            if life_point in city_to_region:
                assigned_office = life_point.capitalize()
            else:
                # prefix-match by region
                for region_key in region_to_office.keys():
                    if region.startswith(region_key):
                        assigned_office = region_to_office[region_key].capitalize()
                        break

    # 2. Manager filtering by skills/position/language
    eligible = [m for m in all_managers if normalize_text(m.business_unit) == normalize_text(assigned_office)]
    segment = ticket_data.get('segment')
    if segment in ('VIP', 'Priority'):
        eligible = [m for m in eligible if 'VIP' in parse_skills(m.skills)]
    request_type = ticket_data.get('request_type')
    if request_type == 'Изменение данных':
        eligible = [m for m in eligible if m.position == 'Главный специалист']
    language = ticket_data.get('language')
    if language == 'ENG':
        eligible = [m for m in eligible if 'ENG' in parse_skills(m.skills)]
    elif language == 'KZ':
        eligible = [m for m in eligible if 'KZ' in parse_skills(m.skills)]
    # RU: no filter

    # If no eligible in office, fallback to core
    warning = None
    if not eligible and normalize_text(assigned_office) not in ('алматы', 'астана'):
        assigned_office = choose_less_loaded_core_office()
        eligible = [m for m in all_managers if normalize_text(m.business_unit) == normalize_text(assigned_office)]
        # re-apply filters
        if segment in ('VIP', 'Priority'):
            eligible = [m for m in eligible if 'VIP' in parse_skills(m.skills)]
        if request_type == 'Изменение данных':
            eligible = [m for m in eligible if m.position == 'Главный специалист']
        if language == 'ENG':
            eligible = [m for m in eligible if 'ENG' in parse_skills(m.skills)]
        elif language == 'KZ':
            eligible = [m for m in eligible if 'KZ' in parse_skills(m.skills)]

    # 3. Round Robin assignment
    assigned = None
    if not eligible:
        # fallback: any manager in assigned_office
        fallback = sorted([m for m in all_managers if normalize_text(m.business_unit) == normalize_text(assigned_office)], key=lambda m: m.requests_in_progress)
        if fallback:
            assigned = fallback[0]
            warning = f"Назначен без полного соответствия навыков. Причина: нет менеджера со всеми требуемыми навыками в офисе {assigned_office}"
        else:
            # fallback: any manager globally
            global_fallback = sorted(all_managers, key=lambda m: m.requests_in_progress)
            assigned = global_fallback[0]
            assigned_office = assigned.business_unit
            warning = f"Офис {assigned_office} не имеет менеджеров. Назначен в {assigned_office}"
    else:
        # Sort eligible by load
        eligible = sorted(eligible, key=lambda m: m.requests_in_progress)
        # Round robin: alternate between least loaded
        res = await db_session.execute(select(RoundRobinState).where(RoundRobinState.office == assigned_office))
        state = res.scalar_one_or_none()
        last_assigned_name = state.last_manager_name if state else None
        if len(eligible) > 1:
            if last_assigned_name == eligible[0].full_name:
                assigned = eligible[1]
            elif last_assigned_name == eligible[1].full_name:
                assigned = eligible[0]
            else:
                assigned = eligible[0]
        else:
            assigned = eligible[0]

    # Predict increment load & RR State
    assigned.requests_in_progress += 1
    res = await db_session.execute(select(RoundRobinState).where(RoundRobinState.office == assigned_office))
    state = res.scalar_one_or_none()
    if state:
        state.last_manager_name = assigned.full_name
        state.updated_at = datetime.datetime.utcnow()
    else:
        new_state = RoundRobinState(office=assigned_office, last_manager_name=assigned.full_name)
        db_session.add(new_state)
    await db_session.commit()
    return assigned, assigned_office, warning
