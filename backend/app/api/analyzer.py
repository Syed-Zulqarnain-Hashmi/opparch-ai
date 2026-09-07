from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.analyzers.website_analyzer import WebsiteAnalyzer
from app.database.models import User
from app.core.security import get_current_user_optional

router = APIRouter(prefix="/analyzer", tags=["Website Intelligence & Auditor"])

class WebsiteAuditRequest(BaseModel):
    url: str
    industry: Optional[str] = None

@router.post("/audit", response_model=Dict[str, Any])
async def audit_website(
    payload: WebsiteAuditRequest,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Performs a real-time, non-intrusive public technical audit of a target website.
    Inspects HTTP status, SSL, response time, page size, HTML structure,
    SEO metadata, OpenGraph tags, heading hierarchy, images/alt tags, forms,
    and business-type relevance with structured evidence.
    """
    if not payload.url or not payload.url.strip():
        raise HTTPException(status_code=400, detail="Website URL is required for audit.")

    res = await WebsiteAnalyzer.analyze_url(payload.url.strip(), industry=payload.industry)
    return res
