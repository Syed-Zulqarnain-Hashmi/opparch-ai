import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.session import engine, Base

from sqlalchemy import text

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
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
    yield

@pytest.mark.asyncio
async def test_root_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"
        assert data["app"] == "OPPARCH AI"

@pytest.mark.asyncio
async def test_projects_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/projects")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "devarcher_fit_score" in data[0]

@pytest.mark.asyncio
async def test_search_discover_natural_language():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "query": "Find restaurants in Islamabad that need a professional website and online ordering.",
            "country": "Pakistan",
            "limit": 10
        }
        response = await client.post("/api/v1/search/discover", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["total_found"] > 0
        assert len(data["leads"]) > 0
        # Verify relationships (score, audit, services) loaded cleanly without MissingGreenlet error
        first_lead = data["leads"][0]
        assert "score" in first_lead and first_lead["score"] is not None
        assert "audit" in first_lead and first_lead["audit"] is not None
        assert "services" in first_lead and len(first_lead["services"]) > 0

@pytest.mark.asyncio
async def test_search_discover_explicit_filters():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "query": "Find businesses needing services",
            "country": "Pakistan",
            "city": "Islamabad",
            "industry": "Restaurants",
            "service_target": "Web Development",
            "limit": 10
        }
        response = await client.post("/api/v1/search/discover", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["parsed_criteria"]["country"] == "Pakistan"
        assert data["parsed_criteria"]["city"] == "Islamabad"
        assert data["parsed_criteria"]["industry"] == "Restaurants"
        assert data["total_found"] > 0

@pytest.mark.asyncio
async def test_ai_settings_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Test Ollama models listing
        res_models = await client.get("/api/v1/settings/ollama-models")
        assert res_models.status_code == 200
        data_models = res_models.json()
        assert "models" in data_models
        assert "default" in data_models

        # Test anonymous AI config
        res_cfg = await client.get("/api/v1/settings/ai-config")
        assert res_cfg.status_code == 200
        data_cfg = res_cfg.json()
        assert data_cfg["provider"] in ["OLLAMA", "DEMO", "GEMINI", "OPENAI"]
        assert "has_gemini_key" in data_cfg
        assert "has_openai_key" in data_cfg

        # Test health status
        res_health = await client.get("/api/v1/settings/health")
        assert res_health.status_code == 200
        data_health = res_health.json()
        assert "online" in data_health
        assert "status" in data_health
