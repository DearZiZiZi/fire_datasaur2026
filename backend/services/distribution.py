import datetime
from typing import List, Tuple, Optional
from models import Manager, RoundRobinState
from services.geo_service import find_nearest_office
from sqlalchemy.future import select

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
    # 1. GEOGRAPHIC FILTER
    target_office = None
    lat, lng = ticket_data.get('lat'), ticket_data.get('lng')
    country = ticket_data.get('country')
    
    kz_aliases = ['Казахстан', 'Kazakhstan', 'KZ', 'Казакстан']
    
    if lat and lng and country and any(c.lower() == country.lower() for c in kz_aliases):
        target_office = find_nearest_office(lat, lng, offices)
    
    if not target_office:
        target_office = await get_foreign_office_rr(db_session)
        
    # 2. COMPETENCE FILTER
    eligible = [m for m in all_managers if m.business_unit == target_office]
    
    # 2a. VIP/Priority -> must have VIP skill
    segment = ticket_data.get('segment')
    if segment in ['VIP', 'Priority']:
        eligible = [m for m in eligible if 'VIP' in parse_skills(m.skills)]
        
    # 2b. Изменение данных -> ONLY Главный специалист
    request_type = ticket_data.get('request_type')
    if request_type == 'Изменение данных':
        eligible = [m for m in eligible if m.position == 'Главный специалист']
        
    # 2c. Language
    language = ticket_data.get('language')
    if language == 'KZ':
        eligible = [m for m in eligible if 'KZ' in parse_skills(m.skills)]
    elif language == 'ENG':
        eligible = [m for m in eligible if 'ENG' in parse_skills(m.skills)]
        
    # 3. ROUND ROBIN
    warning = None
    assigned = None
    
    if not eligible:
        # FALLBACK 1: ANY manager in target_office
        fallback = sorted([m for m in all_managers if m.business_unit == target_office], key=lambda m: m.requests_in_progress)
        if fallback:
            assigned = fallback[0]
            warning = f"Назначен без полного соответствия навыков. Причина: нет менеджера со всеми требуемыми навыками в офисе {target_office}"
        else:
            # FALLBACK 2: ANY manager globally least loaded
            global_fallback = sorted(all_managers, key=lambda m: m.requests_in_progress)
            assigned = global_fallback[0]
            target_office = assigned.business_unit
            warning = f"Офис {target_office} не имеет менеджеров. Назначен в {target_office}"
    else:
        eligible.sort(key=lambda m: m.requests_in_progress)
        top_two = eligible[:2]
        
        # Fetch round robin state
        res = await db_session.execute(select(RoundRobinState).where(RoundRobinState.office == target_office))
        state = res.scalar_one_or_none()
        last_assigned_name = state.last_manager_name if state else None
        
        if len(top_two) == 2:
            if last_assigned_name == top_two[0].full_name:
                assigned = top_two[1]
            elif last_assigned_name == top_two[1].full_name:
                assigned = top_two[0]
            else:
                assigned = top_two[0]
        else:
            assigned = top_two[0]
            
    # Predict increment load & RR State
    assigned.requests_in_progress += 1
    
    res = await db_session.execute(select(RoundRobinState).where(RoundRobinState.office == target_office))
    state = res.scalar_one_or_none()
    
    if state:
        state.last_manager_name = assigned.full_name
        state.updated_at = datetime.datetime.utcnow()
    else:
        new_state = RoundRobinState(office=target_office, last_manager_name=assigned.full_name)
        db_session.add(new_state)
        
    await db_session.commit()
    
    return assigned, target_office, warning
