import httpx
import math
from typing import Tuple, Optional, List
import asyncio

GEO_CACHE = {}

async def geocode_ticket(country: str, region: str, city: str, street: str, house: str) -> Tuple[Optional[float], Optional[float]]:
    # Create query parts skipping none/empty
    query_parts = [p for p in [house, street, city, region, country] if p and isinstance(p, str) and str(p).lower() not in ('nan', 'none')]
    
    if not query_parts:
        return None, None
    
    query = ", ".join(query_parts)
    if query in GEO_CACHE:
        return GEO_CACHE[query]
    
    async with httpx.AsyncClient() as client:
        try:
            await asyncio.sleep(1) # Rate limit respect 1 req/sec
            response = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": query, "format": "json", "limit": 1},
                headers={"User-Agent": "FIRE-SmartDesk/1.0 (freedom-broker-hackathon)"},
                timeout=5.0
            )
            data = response.json()
            if data and len(data) > 0:
                lat, lon = float(data[0]['lat']), float(data[0]['lon'])
                GEO_CACHE[query] = (lat, lon)
                return lat, lon
        except Exception as e:
            print(f"Geocoding error for {query}: {e}")
            
    # Fallback to city + country
    fallback_parts = [p for p in [city, country] if p and isinstance(p, str) and p.lower() not in ('nan', 'none')]
    fallback_query = ", ".join(fallback_parts) if fallback_parts else None
    
    if fallback_query and fallback_query != query:
        if fallback_query in GEO_CACHE:
            GEO_CACHE[query] = GEO_CACHE[fallback_query]
            return GEO_CACHE[fallback_query]
        async with httpx.AsyncClient() as client:
            try:
                await asyncio.sleep(1)
                response = await client.get(
                    "https://nominatim.openstreetmap.org/search",
                    params={"q": fallback_query, "format": "json", "limit": 1},
                    headers={"User-Agent": "FIRE-SmartDesk/1.0 (freedom-broker-hackathon)"},
                    timeout=5.0
                )
                data = response.json()
                if data and len(data) > 0:
                    lat, lon = float(data[0]['lat']), float(data[0]['lon'])
                    GEO_CACHE[fallback_query] = (lat, lon)
                    GEO_CACHE[query] = (lat, lon)
                    return lat, lon
            except Exception:
                pass

    GEO_CACHE[query] = (None, None)
    return None, None

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad

    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def find_nearest_office(ticket_lat: float, ticket_lng: float, offices: List[dict]) -> Optional[str]:
    if not ticket_lat or not ticket_lng or not offices:
        return None
    
    nearest = None
    min_dist = float('inf')
    for office in offices:
        if office.get('lat') is not None and office.get('lng') is not None:
            dist = haversine_km(ticket_lat, ticket_lng, float(office['lat']), float(office['lng']))
            if dist < min_dist:
                min_dist = dist
                nearest = office['office']
    return nearest
