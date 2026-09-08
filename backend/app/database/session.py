import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Determine database URL and engine options
raw_url = os.getenv("DATABASE_URL", settings.DATABASE_URL).strip()

import urllib.parse

def normalize_database_url(url: str) -> str:
    """
    Normalizes database URLs for SQLAlchemy 2.0 async compatibility.
    Handles Render, Neon, Supabase, etc.
    1. Converts postgres:// or postgresql:// to postgresql+asyncpg://
    2. asyncpg uses ssl=require instead of libpq-style sslmode=require
    3. Removes unsupported asyncpg query params like channel_binding
    """
    if not url:
        return url
    
    # Strip any accidental outer quotes
    url = url.strip().strip("'\"")

    # Prefix adjustment
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    # If it's postgresql+asyncpg, sanitize query parameters for asyncpg
    if "postgresql+asyncpg://" in url and "?" in url:
        base_part, query_part = url.split("?", 1)
        params = urllib.parse.parse_qs(query_part)
        new_params = {}
        for k, v in params.items():
            if k == "sslmode":
                new_params["ssl"] = v
            elif k in ("channel_binding", "target_session_attrs"):
                # libpq-specific parameters unsupported by asyncpg
                continue
            else:
                new_params[k] = v
        # Ensure ssl is present for neon / remote hosts if sslmode was require
        if "ssl" not in new_params and ("neon.tech" in url or "sslmode=require" in query_part):
            new_params["ssl"] = ["require"]
        
        new_query = urllib.parse.urlencode(new_params, doseq=True)
        url = f"{base_part}?{new_query}" if new_query else base_part

    return url

db_url = normalize_database_url(raw_url)

if db_url.startswith("sqlite"):
    engine_kwargs = {
        "connect_args": {"check_same_thread": False},
        "echo": False
    }
else:
    # Production PostgreSQL settings for Render / Supabase / Neon
    engine_kwargs = {
        "connect_args": {},
        "echo": False,
        "pool_size": 5,
        "max_overflow": 10,
        "pool_pre_ping": True,
        "pool_recycle": 300
    }

engine = create_async_engine(
    db_url,
    **engine_kwargs
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
