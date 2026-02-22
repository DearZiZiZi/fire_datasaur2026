from fastapi import APIRouter, Depends, Body
from pydantic import BaseModel
import google.generativeai as genai
import os
import json
from database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from routers.analytics import (
    fetch_overview, fetch_by_type, fetch_by_city, 
    fetch_by_tone, fetch_workload, fetch_priority_dist
)
from dotenv import load_dotenv
load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

router = APIRouter(prefix="/api/assistant", tags=["assistant"])

class AssistantRequest(BaseModel):
    query: str

class AssistantResponse(BaseModel):
    chart_type: str
    title: str
    data: list
    x_axis_label: str
    y_axis_label: str
    insight: str

ASSISTANT_SYSTEM = """
You are FIRE Intelligence — an analytics AI for Freedom Broker's ticket system.
You have access to aggregated statistics from the database.

When given a natural language query, return ONLY valid JSON (no markdown):
{
  "chart_type": "bar" | "horizontal_bar" | "pie" | "line" | "donut" | "table",
  "title": "Chart title in the query language",
  "data": [{"name": "...", "value": 0}],
  "x_axis_label": "...",
  "y_axis_label": "...",
  "insight": "1-2 sentence insight in the same language as the query"
}

Available data context:
{stats_json}

If the query cannot be answered from available data, return:
{"error": "explanation of what data is missing"}
"""

@router.post("/query", response_model=AssistantResponse)
async def query_assistant(req: AssistantRequest, db: AsyncSession = Depends(get_db)):
    # Fetch real stats
    stats = {
        "overview": await fetch_overview(db),
        "by_type": await fetch_by_type(db),
        "by_city": await fetch_by_city(db),
        "by_tone": await fetch_by_tone(db),
        "workload": await fetch_workload(db),
        "priority": await fetch_priority_dist(db)
    }

    prompt = ASSISTANT_SYSTEM.replace("{stats_json}", json.dumps(stats))
    
    import asyncio
    try:
        response = await asyncio.wait_for(
            model.generate_content_async(
                contents=[{"role": "user", "parts": [{"text": prompt}, {"text": req.query}]}],
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=AssistantResponse,
                    temperature=0.2
                )
            ),
            timeout=10
        )
        return json.loads(response.text)
    except asyncio.TimeoutError:
        return {
            "chart_type": "bar",
            "title": "Timeout",
            "data": [],
            "x_axis_label": "",
            "y_axis_label": "",
            "insight": "Gemini API response timed out. Please try again or rephrase your query."
        }
    except Exception as e:
        return {
            "chart_type": "bar",
            "title": "Error",
            "data": [],
            "x_axis_label": "",
            "y_axis_label": "",
            "insight": f"Failed to retrieve insight: {e}"
        }
