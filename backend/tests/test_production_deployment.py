import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.session import normalize_database_url
from app.providers.ai_provider import AIProvider
from app.core.config import settings

@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        assert res.json() == {"status": "ok"}

def test_database_url_normalization_postgres():
    # Render postgres:// style
    url1 = "postgres://user:pass@ep-test.oregon-postgres.render.com:5432/dbname"
    norm1 = normalize_database_url(url1)
    assert norm1.startswith("postgresql+asyncpg://")

    # standard postgresql:// style
    url2 = "postgresql://user:pass@localhost:5432/dbname"
    norm2 = normalize_database_url(url2)
    assert norm2.startswith("postgresql+asyncpg://")

    # already postgresql+asyncpg:// style
    url3 = "postgresql+asyncpg://user:pass@localhost:5432/dbname"
    norm3 = normalize_database_url(url3)
    assert norm3 == url3

def test_database_url_normalization_sqlite():
    url = "sqlite+aiosqlite:///./opparch_ai.db"
    assert normalize_database_url(url) == url

@pytest.mark.asyncio
async def test_ai_provider_openai_strict_no_ollama_fallback():
    """Verify that selecting OpenAI when unconfigured returns clear error without silent Ollama fallback."""
    res = await AIProvider.generate_completion(
        prompt="Test prompt",
        provider="OPENAI",
        openai_key="" # deliberately empty
    )
    assert "OpenAI" in res["provider_used"]
    assert res["fallback_triggered"] is False
    assert "error" in res or "unconfigured" in res["provider_used"].lower()

@pytest.mark.asyncio
async def test_ai_provider_gemini_strict_no_ollama_fallback():
    """Verify that selecting Gemini when unconfigured returns clear error without silent Ollama fallback."""
    res = await AIProvider.generate_completion(
        prompt="Test prompt",
        provider="GEMINI",
        gemini_key="" # deliberately empty
    )
    assert "Gemini" in res["provider_used"]
    assert res["fallback_triggered"] is False
    assert "error" in res or "unconfigured" in res["provider_used"].lower()

@pytest.mark.asyncio
async def test_ai_provider_analyze_business_transparent_label():
    """Verify analyze_business returns transparent provider label when provider is selected."""
    res = await AIProvider.analyze_business(
        business_name="Test Cafe",
        industry="Restaurants",
        country="Pakistan",
        city="Islamabad",
        has_website=False,
        website_status="MISSING",
        phone=None,
        email=None,
        audit_evidence=[],
        missing_features=[],
        opportunity_score=90,
        provider="OPENAI",
        openai_key=""
    )
    assert "reasoning" in res
    # Ensure it did not falsely claim Ollama was used when OpenAI was selected
    assert "Ollama" not in res["ai_provider"]
