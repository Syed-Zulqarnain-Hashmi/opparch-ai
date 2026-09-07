from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.admin import router as admin_router
from app.api.search import router as search_router
from app.api.leads import router as leads_router
from app.api.projects import router as projects_router
from app.api.emerging import router as emerging_router
from app.api.crm import router as crm_router
from app.api.outreach import router as outreach_router
from app.api.analytics import router as analytics_router
from app.api.export import router as export_router
from app.api.settings_api import router as settings_api_router
from app.api.ai import router as ai_router
from app.api.market import router as market_router
from app.api.ws_market import router as ws_market_router
from app.api.contact import router as contact_router
from app.api.analyzer import router as analyzer_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(admin_router)
api_router.include_router(search_router)
api_router.include_router(leads_router)
api_router.include_router(projects_router)
api_router.include_router(emerging_router)
api_router.include_router(crm_router)
api_router.include_router(outreach_router)
api_router.include_router(analytics_router)
api_router.include_router(export_router)
api_router.include_router(settings_api_router)
api_router.include_router(ai_router)
api_router.include_router(market_router)
api_router.include_router(ws_market_router)
api_router.include_router(contact_router)
api_router.include_router(analyzer_router)

