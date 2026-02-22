from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import os
from dotenv import load_dotenv

from routers import tickets, managers, analytics, assistant, synthetic

app = FastAPI(title="Freedom Intelligent Routing Engine API")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "*"], # Allow all for local dev flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Database initialization
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        print(f"⚠️ Warning: Database initialization failed: {e}")
        print("The server will start, but database-dependent endpoints will fail.")

app.include_router(tickets.router)
app.include_router(managers.router)
app.include_router(analytics.router)
app.include_router(assistant.router)
app.include_router(synthetic.router)

@app.get("/")
def read_root():
    return {"status": "FIRE Backend is running!"}
