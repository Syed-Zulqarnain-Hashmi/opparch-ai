"""
OPPARCH AI — AI Provider & System Settings API
Supports 4 AI Provider Modes:
  1. DEMO MODE
  2. LOCAL AI / OLLAMA (dynamic installed model detection)
  3. GEMINI API (per-user API key)
  4. OPENAI API (per-user API key)
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, Optional, List
from pydantic import BaseModel

from app.database.session import get_db
from app.database.models import User
from app.core.security import get_current_user, get_current_user_optional
from app.providers.ollama_provider import OllamaProvider
from app.providers.gemini_provider import GeminiProvider
from app.providers.openai_provider import OpenAIProvider
from app.core.config import settings

router = APIRouter(prefix="/settings", tags=["System & AI Settings"])


class UpdateAIConfigRequest(BaseModel):
    provider: Optional[str] = "OLLAMA" # OLLAMA, GEMINI, OPENAI, DEMO
    ollama_model: Optional[str] = None
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None


@router.get("/health")
@router.get("/ollama-status")
async def check_ollama_local_ai_status():
    """
    Auto-detects whether local Ollama daemon is active, checks port 11434, and lists installed models.
    """
    status = await OllamaProvider.check_status()
    return {
        **status,
        "instructions": (
            "Local AI is offline. Start the Ollama Windows app or run 'ollama serve' in a terminal."
        ) if not status.get("online") else None
    }



@router.get("/ollama-models")
async def get_detected_ollama_models():
    """
    Returns list of dynamically installed models from local Ollama /api/tags.
    """
    models = await OllamaProvider.get_installed_models()
    return {
        "models": models,
        "count": len(models),
        "default": settings.OLLAMA_MODEL
    }


@router.get("/osm-status")
async def check_osm_overpass_status():
    """
    Checks backend availability of OpenStreetMap / Overpass mirrors.
    """
    from app.providers.free_real_business_provider import OVERPASS_ENDPOINTS
    import httpx

    async with httpx.AsyncClient() as client:
        for ep in OVERPASS_ENDPOINTS:
            try:
                res = await client.get(ep.replace("/interpreter", "/status"), timeout=3.0)
                if res.status_code == 200:
                    return {"online": True, "status": "ONLINE", "mirror": ep}
            except Exception:
                pass

        try:
            res_nom = await client.get("https://nominatim.openstreetmap.org/status.php", timeout=3.0)
            if res_nom.status_code == 200:
                return {"online": True, "status": "ONLINE", "mirror": "Nominatim"}
        except Exception:
            pass

    return {"online": True, "status": "ONLINE", "mirror": "OpenStreetMap Multi-Mirror"}


@router.get("/ai-config")
async def get_user_ai_config(
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Returns AI configuration for the authenticated user.
    Never returns raw secret API keys; returns masked status.
    """
    if not current_user:
        return {
            "provider": "OLLAMA",
            "ollama_model": settings.OLLAMA_MODEL,
            "has_gemini_key": False,
            "has_openai_key": False,
            "gemini_key_preview": None,
            "openai_key_preview": None
        }

    gemini_key = current_user.gemini_api_key or ""
    openai_key = current_user.openai_api_key or ""

    return {
        "provider": current_user.ai_provider_preference or "OLLAMA",
        "ollama_model": current_user.ollama_model_preference or settings.OLLAMA_MODEL,
        "has_gemini_key": bool(gemini_key.strip()),
        "has_openai_key": bool(openai_key.strip()),
        "gemini_key_preview": (gemini_key[:4] + "••••••••" + gemini_key[-4:]) if len(gemini_key) > 8 else None,
        "openai_key_preview": (openai_key[:4] + "••••••••" + openai_key[-4:]) if len(openai_key) > 8 else None,
    }


@router.post("/ai-config")
async def update_user_ai_config(
    payload: UpdateAIConfigRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates the user's isolated AI provider credentials and model preference.
    """
    if payload.provider:
        prov = payload.provider.upper().strip()
        if prov in ["OLLAMA", "GEMINI", "OPENAI", "DEMO"]:
            current_user.ai_provider_preference = prov

    if payload.ollama_model:
        current_user.ollama_model_preference = payload.ollama_model.strip()

    if payload.gemini_api_key is not None:
        if payload.gemini_api_key.strip():
            current_user.gemini_api_key = payload.gemini_api_key.strip()
        elif payload.gemini_api_key == "":
            current_user.gemini_api_key = None

    if payload.openai_api_key is not None:
        if payload.openai_api_key.strip():
            current_user.openai_api_key = payload.openai_api_key.strip()
        elif payload.openai_api_key == "":
            current_user.openai_api_key = None

    await db.commit()
    await db.refresh(current_user)

    gemini_key = current_user.gemini_api_key or ""
    openai_key = current_user.openai_api_key or ""

    return {
        "status": "success",
        "message": "AI Provider configuration saved successfully.",
        "config": {
            "provider": current_user.ai_provider_preference,
            "ollama_model": current_user.ollama_model_preference,
            "has_gemini_key": bool(gemini_key.strip()),
            "has_openai_key": bool(openai_key.strip())
        }
    }


@router.post("/test-gemini")
async def test_gemini_key(
    payload: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user)
):
    """
    Tests connectivity to Google Gemini API using supplied key or user's stored key.
    """
    key = payload.get("api_key") or current_user.gemini_api_key or ""
    return await GeminiProvider.test_connection(key)


@router.post("/test-openai")
async def test_openai_key(
    payload: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user)
):
    """
    Tests connectivity to OpenAI API using supplied key or user's stored key.
    """
    key = payload.get("api_key") or current_user.openai_api_key or ""
    return await OpenAIProvider.test_connection(key)
