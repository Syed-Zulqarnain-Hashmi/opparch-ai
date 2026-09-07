import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.database.session import engine, Base
from app.api.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        # Non-destructive SQLite schema migration for procurement_projects
        for col, ctype in [
            ("category", "VARCHAR DEFAULT 'PROCUREMENT'"),
            ("status", "VARCHAR DEFAULT 'ACTIVE'"),
            ("published_date", "VARCHAR"),
            ("last_updated_at", "DATETIME")
        ]:
            try:
                await conn.execute(text(f"ALTER TABLE procurement_projects ADD COLUMN {col} {ctype}"))
            except Exception:
                pass

        # Non-destructive SQLite schema migration for users table
        for col, ctype in [
            ("ai_provider_preference", "VARCHAR DEFAULT 'OLLAMA'"),
            ("ollama_model_preference", "VARCHAR DEFAULT 'qwen3:4b'"),
            ("gemini_api_key", "TEXT"),
            ("openai_api_key", "TEXT")
        ]:
            try:
                await conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {ctype}"))
            except Exception:
                pass

        # Non-destructive SQLite schema migration for business_leads (new CRM & email fields)
        for col, ctype in [
            ("email_status", "VARCHAR DEFAULT 'not_found'"),
            ("email_source", "VARCHAR"),
            ("email_source_url", "VARCHAR"),
            ("email_confidence", "VARCHAR"),
            ("contact_person", "VARCHAR"),
        ]:
            try:
                await conn.execute(text(f"ALTER TABLE business_leads ADD COLUMN {col} {ctype}"))
            except Exception:
                pass


    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=f"{settings.TAGLINE} — Unified AI Opportunity Intelligence Platform",
    version="2.0.0",
    lifespan=lifespan
)

# CORS setup for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/")
async def root_health_check():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "platform": settings.PLATFORM_NAME,
        "demo_mode": settings.DEMO_MODE,
        "documentation": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
