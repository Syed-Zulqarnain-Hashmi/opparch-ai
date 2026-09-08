import os
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
        
        # Non-destructive SQLite schema migration for older local databases
        if engine.dialect.name == "sqlite":
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

# ── CORS Setup for Vercel Frontend & Local Development ───────────────────────
default_origins = [
    "https://opparch-ai.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

env_cors = [o.strip().rstrip("/") for o in settings.CORS_ORIGINS.split(",") if o.strip()]
allowed_origins = list(set(default_origins + env_cors))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https:\/\/opparch-ai(-[a-z0-9-]+)?\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/health")
async def health_check():
    """
    Render and cloud deployment health-check endpoint.
    Returns 200 OK without requiring authentication.
    """
    return {"status": "ok"}

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
    port = int(os.environ.get("PORT", settings.PORT))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
