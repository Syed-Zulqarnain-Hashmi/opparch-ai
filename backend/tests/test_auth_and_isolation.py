import pytest
import pytest_asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.session import engine, Base
from app.providers.ollama_provider import OllamaProvider

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

@pytest.mark.asyncio
async def test_auth_registration_and_admin_role():
    test_id = str(uuid.uuid4())[:8]
    admin_email = f"admin_{test_id}@devarcher.com"
    user_email = f"user_{test_id}@agency.com"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # First registered user becomes ADMIN automatically if DB clean, or registers account
        admin_payload = {
            "email": admin_email,
            "password": "AdminPassword123",
            "full_name": "Syed Zulqarnain Nasir"
        }
        res1 = await client.post("/api/v1/auth/register", json=admin_payload)
        assert res1.status_code == 200
        data1 = res1.json()
        assert "access_token" in data1
        admin_token = data1["access_token"]

        # Second registered user
        user_payload = {
            "email": user_email,
            "password": "UserPassword123",
            "full_name": "John Client"
        }
        res2 = await client.post("/api/v1/auth/register", json=user_payload)
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["user"]["role"] in ["USER", "ADMIN"]
        user_token = data2["access_token"]

        # Test login
        login_res = await client.post("/api/v1/auth/login", json={
            "email": admin_email,
            "password": "AdminPassword123"
        })
        assert login_res.status_code == 200
        assert "access_token" in login_res.json()

@pytest.mark.asyncio
async def test_ollama_fallback_graceful():
    status = await OllamaProvider.check_status()
    assert "online" in status
    assert "message" in status
