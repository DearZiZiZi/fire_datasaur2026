import httpx
import os
import re
import logging

API_KEY_2GIS = os.getenv("API_KEY_2GIS")
logger = logging.getLogger("geo_service")
import math
from typing import Tuple, Optional, List
import asyncio

GEO_CACHE = {}

async def geocode_ticket(country: str, region: str, city: str, street: str, house: str, max_parts: int = 6, max_length: int = 200) -> Tuple[Optional[float], Optional[float]]:
    """
    Геокодирование через API 2GIS с жадным поиском (greedy fallback)
    """
    query_parts = [p for p in [house, street, city, region, country] if p and isinstance(p, str) and str(p).lower() not in ('nan', 'none')]
    if not query_parts:
        return None, None
    query = ", ".join(query_parts)
    if len(query) > max_length:
        query = query[:max_length]
    cleaned = re.sub(r'[«»"“”]', '', query)
    parts = [p.strip() for p in cleaned.split(',') if p.strip()]
    if len(parts) > max_parts:
        parts = parts[:max_parts]
    async with httpx.AsyncClient() as client:
        while len(parts) > 0:
            search_query = ", ".join(parts)
            if search_query in GEO_CACHE:
                return GEO_CACHE[search_query]
            url = "https://catalog.api.2gis.com/3.0/items/geocode"
            params = {
                "q": search_query,
                "fields": "items.point",
                "key": API_KEY_2GIS
            }
            try:
                await asyncio.sleep(0.2)
                response = await client.get(url, params=params, timeout=5.0)
                data = response.json()
                if data.get("meta", {}).get("code") == 200 and "result" in data:
                    items = data["result"].get("items", [])
                    if len(items) > 0:
                        point = items[0].get("point")
                        if point:
                            lat, lon = float(point["lat"]), float(point["lon"])
                            GEO_CACHE[search_query] = (lat, lon)
                            logger.info(f"OK: 2Gis -> {search_query} -> {lat}, {lon}")
                            return lat, lon
            except Exception as e:
                logger.error(f"ERROR '{search_query}': {e}")
                return None, None
            logger.warning(f"NOT FOUND: {search_query}. Reducing...")
            parts.pop()
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
