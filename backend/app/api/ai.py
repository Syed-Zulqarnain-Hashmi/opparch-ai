"""
OPPARCH AI — AI Health & Status Endpoint
GET /api/v1/ai/health  → Ollama daemon status + installed models
"""
from fastapi import APIRouter
from app.providers.ollama_provider import OllamaProvider
from app.core.config import settings

router = APIRouter(prefix="/ai", tags=["Local AI (Ollama)"])


@router.get("/health")
async def ai_health_check():
    """
    Reports local Ollama daemon status, configured model, and installed models.
    Used by the Settings panel and admin dashboard.
    """
    status = await OllamaProvider.check_status()
    return {
        **status,
        "instructions": (
            "Ollama is offline. To enable Local AI:\n"
            "1. Download: https://ollama.com/download\n"
            "2. Run: ollama serve\n"
            "3. Pull model: ollama pull qwen3:4b"
        ) if not status.get("online") else None
    }


@router.get("/models")
async def list_ai_models():
    """
    Lists all installed Ollama models on this machine.
    """
    status = await OllamaProvider.check_status()
    return {
        "online": status.get("online", False),
        "status": status.get("status", "OFFLINE"),
        "models": status.get("models", []),
        "configured_model": settings.OLLAMA_MODEL,
        "base_url": settings.OLLAMA_BASE_URL
    }

