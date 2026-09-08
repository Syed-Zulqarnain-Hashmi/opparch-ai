import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Determine database URL and engine options
raw_url = os.getenv("DATABASE_URL", settings.DATABASE_URL).strip()

def normalize_database_url(url: str) -> str:
    """
    Normalizes database URLs for SQLAlchemy 2.0 async compatibility.
    Render and cloud providers provide URLs starting with postgres:// or postgresql://.
    SQLAlchemy async requires postgresql+asyncpg://.
    """
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
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
