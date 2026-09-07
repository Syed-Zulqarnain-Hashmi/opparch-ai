from fastapi import APIRouter, Body
from typing import Dict, Any
from app.core.config import settings

router = APIRouter(prefix="/settings", tags=["System Settings & Services Catalog"])

@router.get("")
async def get_settings():
    """
    Returns current platform settings, active mode (Demo/Real), and DevArcher service catalog.
    """
    return {
        "project_name": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "agency_name": settings.AGENCY_NAME,
        "agency_website": settings.AGENCY_WEBSITE,
        "demo_mode": settings.DEMO_MODE,
        "has_openai_key": bool(settings.OPENAI_API_KEY),
        "has_search_key": bool(settings.SEARCH_API_KEY),
        "analysis_depth": settings.DEFAULT_ANALYSIS_DEPTH,
        "services_catalog": settings.DEVARCHER_SERVICES
    }

@router.post("/toggle-mode")
async def toggle_demo_mode(payload: Dict[str, Any] = Body(...)):
    """
    Toggles between Demo Mode (preloaded realistic datasets) and Real Mode (live APIs).
    """
    demo_mode = payload.get("demo_mode", True)
    settings.DEMO_MODE = demo_mode
    return {"status": "success", "demo_mode": settings.DEMO_MODE}
