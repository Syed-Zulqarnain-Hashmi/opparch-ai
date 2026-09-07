import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any


from app.database.session import get_db
from app.database.models import BusinessLead, LeadScore, LeadAudit, LeadServiceMatch, User
from app.schemas.schemas import BusinessLeadResponse, LeadAuditSchema, LeadScoreSchema, ServiceMatchSchema
from app.analyzers.website_analyzer import WebsiteAnalyzer
from app.core.security import get_current_user_optional, get_current_user
from app.providers.free_real_business_provider import FreeRealBusinessProvider
from app.scoring.scoring_engine import OpportunityScoringEngine
from app.scoring.service_matcher import ServiceMatcher

router = APIRouter(prefix="/leads", tags=["Lead Intelligence"])

def format_lead_response(lead: BusinessLead) -> BusinessLeadResponse:
    score_data = None
    if lead.score:
        score_data = LeadScoreSchema(
            opportunity_score=lead.score.opportunity_score,
            priority_level=lead.score.priority_level,
            confidence=lead.score.confidence,
            breakdown={
                "website_gap_score": lead.score.website_gap_score,
                "digital_weakness_score": lead.score.digital_weakness_score,
                "business_activity_score": lead.score.business_activity_score,
                "social_presence_score": lead.score.social_presence_score,
                "ecommerce_opportunity_score": lead.score.ecommerce_opportunity_score,
                "ux_opportunity_score": lead.score.ux_opportunity_score,
                "mobile_opportunity_score": lead.score.mobile_opportunity_score,
                "branding_opportunity_score": lead.score.branding_opportunity_score
            },
            reasoning_summary=lead.score.reasoning_summary or ""
        )

    audit_data = None
    if lead.audit:
        audit_data = LeadAuditSchema(
            website_status=lead.audit.website_status,
            mobile_friendly=lead.audit.mobile_friendly,
            ssl_active=lead.audit.ssl_active,
            page_speed_rating=lead.audit.page_speed_rating,
            seo_quality=lead.audit.seo_quality,
            ux_rating=lead.audit.ux_rating,
            missing_digital_features=lead.audit.missing_digital_features or [],
            evidence_points=lead.audit.evidence_points or [],
            pain_points=lead.audit.pain_points or []
        )

    service_matches = [
        ServiceMatchSchema(
            service_id=sm.service_id,
            service_name=sm.service_name,
            fit_rank=sm.fit_rank,
            match_confidence=sm.match_confidence,
            match_reason=sm.match_reason
        ) for sm in (lead.services or [])
    ]

    from app.providers.email_provider import EmailProvider

    email_val = lead.email.strip() if lead.email else None
    email_status = getattr(lead, "email_status", None)
    if not email_status or email_status == "UNVERIFIED":
        if email_val and EmailProvider.validate_email_syntax(email_val):
            email_status = "VALID FORMAT"
        elif email_val:
            email_status = "INVALID FORMAT"
        else:
            email_status = "NO EMAIL"

    return BusinessLeadResponse(
        id=lead.id,
        user_id=lead.user_id,
        name=lead.name,
        country=lead.country,
        city=lead.city,
        region=lead.region,
        industry=lead.industry,
        website_url=lead.website_url,
        domain=lead.domain,
        has_website=lead.has_website,
        phone=lead.phone,
        email=email_val,
        email_status=email_status,
        contact_person=getattr(lead, "contact_person", None),
        address=lead.address,
        social_presence=lead.social_presence or {},
        discovery_source=lead.discovery_source,
        source_url=lead.source_url,
        is_demo_data=lead.is_demo_data,
        data_mode=getattr(lead, "data_mode", "DEMO"),
        pipeline_stage=lead.pipeline_stage,
        priority=lead.priority,
        follow_up_date=lead.follow_up_date,
        internal_notes=lead.internal_notes,
        deal_value=lead.deal_value or 0.0,
        created_at=lead.created_at,
        score=score_data,
        audit=audit_data,
        services=service_matches
    )


@router.get("/stats", response_model=dict)
async def get_lead_stats(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns live count metrics (Total, New, High Opportunity, Contacted, Replied, Won, Last Updated).
    """
    stmt = select(BusinessLead)
    if current_user and current_user.role != "ADMIN":
        stmt = stmt.where((BusinessLead.user_id == current_user.id) | (BusinessLead.user_id == None))

    leads = (await db.execute(stmt)).scalars().all()
    
    total = len(leads)
    new_count = sum(1 for l in leads if l.pipeline_stage == "NEW")
    high_opp = sum(1 for l in leads if l.priority == "HIGH")
    contacted = sum(1 for l in leads if l.pipeline_stage == "CONTACTED")
    replied = sum(1 for l in leads if l.pipeline_stage == "REPLIED")
    won = sum(1 for l in leads if l.pipeline_stage == "WON")

    latest_lead = max([l.updated_at or l.created_at for l in leads], default=datetime.datetime.utcnow())

    return {
        "total_leads": total,
        "new_leads": new_count,
        "high_opportunity": high_opp,
        "contacted": contacted,
        "replied": replied,
        "won": won,
        "last_updated": latest_lead.isoformat() if latest_lead else datetime.datetime.utcnow().isoformat()
    }

@router.get("", response_model=List[BusinessLeadResponse])
async def list_leads(
    country: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    pipeline_stage: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    List business leads with user data isolation.
    """
    stmt = (
        select(BusinessLead)
        .options(
            selectinload(BusinessLead.score),
            selectinload(BusinessLead.audit),
            selectinload(BusinessLead.services)
        )
    )

    if current_user and current_user.role != "ADMIN":
        stmt = stmt.where((BusinessLead.user_id == current_user.id) | (BusinessLead.user_id == None))

    if country and country != "Worldwide":
        stmt = stmt.where(BusinessLead.country == country)
    if industry and industry != "All":
        stmt = stmt.where(BusinessLead.industry == industry)
    if priority and priority != "All":
        stmt = stmt.where(BusinessLead.priority == priority)
    if pipeline_stage and pipeline_stage != "All":
        stmt = stmt.where(BusinessLead.pipeline_stage == pipeline_stage)

    stmt = stmt.order_by(BusinessLead.created_at.desc())
    results = (await db.execute(stmt)).scalars().all()
    
    return [format_lead_response(lead) for lead in results]

@router.post("/refresh", response_model=dict)
async def refresh_leads(
    country: Optional[str] = "Pakistan",
    city: Optional[str] = "Islamabad",
    industry: Optional[str] = "Medical Stores",
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Triggers a live discovery refresh from OpenStreetMap Overpass API, deduplicating and saving new opportunities.
    """
    raw_businesses = await FreeRealBusinessProvider.discover_businesses(
        country=country,
        city=city,
        industry=industry,
        limit=10
    )

    if not raw_businesses:
        return {
            "status": "warning",
            "message": "REAL DATA SOURCE UNAVAILABLE or returned 0 new entries.",
            "new_leads_count": 0,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }

    new_count = 0
    updated_count = 0

    for b in raw_businesses:
        stmt = select(BusinessLead).where(
            BusinessLead.name == b["name"],
            BusinessLead.country == b["country"]
        )
        existing = (await db.execute(stmt)).scalar_one_or_none()

        if existing:
            existing.updated_at = datetime.datetime.utcnow()
            updated_count += 1
        else:
            # Audit & Score
            audit_res = await WebsiteAnalyzer.analyze_url(b.get("website_url"))
            total_score, priority, breakdown, reasoning = OpportunityScoringEngine.calculate_score(
                has_website=b["has_website"],
                website_status=audit_res["website_status"],
                social_presence=b.get("social_presence", {}),
                missing_features=audit_res.get("missing_digital_features", []),
                page_speed=audit_res.get("page_speed_rating", "MODERATE"),
                seo_quality=audit_res.get("seo_quality", "POOR"),
                ux_rating=audit_res.get("ux_rating", "POOR"),
                industry=b["industry"]
            )

            services = ServiceMatcher.match_services(
                has_website=b["has_website"],
                website_status=audit_res["website_status"],
                mobile_friendly=audit_res.get("mobile_friendly", False),
                page_speed=audit_res.get("page_speed_rating", "MODERATE"),
                seo_quality=audit_res.get("seo_quality", "POOR"),
                ux_rating=audit_res.get("ux_rating", "POOR"),
                missing_features=audit_res.get("missing_digital_features", []),
                industry=b["industry"]
            )

            new_lead = BusinessLead(
                user_id=current_user.id if current_user else None,
                name=b["name"],
                country=b["country"],
                city=b.get("city"),
                industry=b["industry"],
                website_url=b.get("website_url"),
                has_website=b["has_website"],
                phone=b.get("phone"),
                email=b.get("email"),
                address=b.get("address"),
                social_presence=b.get("social_presence", {}),
                discovery_source=b["discovery_source"],
                source_url=b.get("source_url"),
                is_demo_data=False,
                data_mode="REAL_FREE",
                pipeline_stage="NEW",
                priority=priority
            )
            db.add(new_lead)
            await db.flush()

            # Add score
            score_obj = LeadScore(
                lead_id=new_lead.id,
                opportunity_score=total_score,
                priority_level=priority,
                confidence=0.92,
                website_gap_score=breakdown.get("website_gap_score", 25),
                digital_weakness_score=breakdown.get("digital_weakness_score", 15),
                reasoning_summary=reasoning
            )
            db.add(score_obj)

            # Add audit
            audit_obj = LeadAudit(
                lead_id=new_lead.id,
                website_status=audit_res["website_status"],
                mobile_friendly=audit_res["mobile_friendly"],
                ssl_active=audit_res["ssl_active"],
                page_speed_rating=audit_res["page_speed_rating"],
                seo_quality=audit_res["seo_quality"],
                ux_rating=audit_res["ux_rating"],
                missing_digital_features=audit_res["missing_digital_features"],
                evidence_points=audit_res["evidence_points"],
                pain_points=audit_res["pain_points"]
            )
            db.add(audit_obj)

            # Add service match
            for sm in services:
                sm_obj = LeadServiceMatch(
                    lead_id=new_lead.id,
                    service_id=sm["service_id"],
                    service_name=sm["service_name"],
                    fit_rank=sm["fit_rank"],
                    match_confidence=sm["match_confidence"],
                    match_reason=sm["match_reason"]
                )
                db.add(sm_obj)

            new_count += 1

    await db.commit()
    return {
        "status": "success",
        "message": f"Lead repository refreshed. {new_count} new real leads discovered, {updated_count} verified.",
        "new_leads_count": new_count,
        "updated_leads_count": updated_count,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

@router.get("/{lead_id}", response_model=BusinessLeadResponse)
async def get_lead_details(
    lead_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve comprehensive lead intelligence details including score breakdown, audit evidence, and DevArcher service matches.
    """
    stmt = (
        select(BusinessLead)
        .where(BusinessLead.id == lead_id)
        .options(
            selectinload(BusinessLead.score),
            selectinload(BusinessLead.audit),
            selectinload(BusinessLead.services)
        )
    )
    lead = (await db.execute(stmt)).scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    return format_lead_response(lead)


@router.put("/{lead_id}", response_model=BusinessLeadResponse)
async def update_lead_details(
    lead_id: str,
    payload: Dict[str, Any],
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Manual Data Completion & Research Update:
    Allows user to manually enter/correct:
      - Business Name
      - Business Type (industry)
      - City
      - Email (with syntax validation, whitespace stripping, and duplicate checks)
      - Phone
      - Website (automatically computes has_website)
      - Social presence (Instagram, Facebook, LinkedIn, Google presence, Online ordering)
      - Contact Person
      - Internal Notes
      - Move from NEW -> RESEARCHING or any stage
    """
    from app.providers.email_provider import EmailProvider

    stmt = (
        select(BusinessLead)
        .where(BusinessLead.id == lead_id)
        .options(
            selectinload(BusinessLead.score),
            selectinload(BusinessLead.audit),
            selectinload(BusinessLead.services)
        )
    )
    lead = (await db.execute(stmt)).scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Update basic text fields if provided
    if "name" in payload and payload["name"]:
        lead.name = payload["name"].strip()
    if "industry" in payload and payload["industry"]:
        lead.industry = payload["industry"].strip()
    if "city" in payload:
        lead.city = payload["city"].strip() if payload["city"] else None
    if "phone" in payload:
        lead.phone = payload["phone"].strip() if payload["phone"] else None
    if "address" in payload:
        lead.address = payload["address"].strip() if payload["address"] else None
    if "contact_person" in payload:
        lead.contact_person = payload["contact_person"].strip() if payload["contact_person"] else None
    if "internal_notes" in payload:
        lead.internal_notes = payload["internal_notes"]
    if "deal_value" in payload and payload["deal_value"] is not None:
        lead.deal_value = float(payload["deal_value"])
    if "priority" in payload and payload["priority"]:
        lead.priority = payload["priority"]

    # Handle Website update
    if "website_url" in payload:
        w_url = payload["website_url"].strip() if payload["website_url"] else None
        lead.website_url = w_url
        lead.has_website = bool(w_url and len(w_url) > 3)
        if lead.audit:
            lead.audit.website_status = "ACTIVE" if lead.has_website else "NOT_FOUND"

    # Handle Email with strict validation & formatting
    if "email" in payload:
        raw_email = (payload["email"] or "").strip()
        if raw_email:
            if not EmailProvider.validate_email_syntax(raw_email):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid email format: '{raw_email}'. Please enter a valid email (e.g. contact@business.com)."
                )
            # Duplicate prevention check across other leads
            dup_stmt = select(BusinessLead).where(
                BusinessLead.email == raw_email,
                BusinessLead.id != lead.id
            )
            existing_dup = (await db.execute(dup_stmt)).scalar_one_or_none()
            if existing_dup:
                raise HTTPException(
                    status_code=400,
                    detail=f"Email '{raw_email}' is already registered with lead '{existing_dup.name}'."
                )
            lead.email = raw_email
            lead.email_status = "VALID FORMAT"
        else:
            lead.email = None
            lead.email_status = "NO EMAIL"

    # Handle Social Presence / Social Links (Instagram, Facebook, LinkedIn)
    current_social = dict(lead.social_presence or {})
    if "instagram" in payload:
        current_social["instagram"] = payload["instagram"].strip() if payload["instagram"] else None
    if "facebook" in payload:
        current_social["facebook"] = payload["facebook"].strip() if payload["facebook"] else None
    if "linkedin" in payload:
        current_social["linkedin"] = payload["linkedin"].strip() if payload["linkedin"] else None
    if "social_presence" in payload and isinstance(payload["social_presence"], dict):
        current_social.update(payload["social_presence"])
    lead.social_presence = current_social

    # Handle Stage Transition (e.g. Save & Move to Researching)
    if "pipeline_stage" in payload and payload["pipeline_stage"]:
        new_stage = payload["pipeline_stage"].strip().upper()
        lead.pipeline_stage = new_stage

    # Dynamic Service & Opportunity Reasoning refresh based on updated information
    if lead.services and len(lead.services) > 0:
        # Check if services should be tailored
        industry_lower = lead.industry.lower()
        if not lead.has_website:
            if any(k in industry_lower for k in ["restaurant", "food", "cafe", "dining"]):
                lead.services[0].service_name = "Restaurant Website & Online Ordering"
                lead.services[0].match_reason = "No official website detected. Propose digital menu and ordering workflows."
            elif any(k in industry_lower for k in ["medical", "pharmacy", "clinic", "hospital"]):
                lead.services[0].service_name = "Business Website & Online Inquiry"
                lead.services[0].match_reason = "No official website detected. Propose modern healthcare digital presence & inquiry capture."
            elif any(k in industry_lower for k in ["clothing", "fashion", "boutique", "retail", "shop", "store"]):
                lead.services[0].service_name = "E-Commerce Website & Product Catalog"
                lead.services[0].match_reason = "No online store detected. Propose digital catalog with checkout and payments."
            else:
                lead.services[0].service_name = "Full-Stack Web Development"
                lead.services[0].match_reason = "No official website detected. Propose modern, mobile-friendly business website."

    if current_user and not lead.user_id:
        lead.user_id = current_user.id

    lead.updated_at = datetime.datetime.utcnow()
    await db.commit()
    await db.refresh(lead)

    return format_lead_response(lead)


class BatchDeleteRequest(BaseModel):
    lead_ids: List[str]


@router.delete("/{lead_id}", response_model=Dict[str, Any])
async def delete_lead(
    lead_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Deletes a single lead and all associated scores, audits, outreach logs, and notes.
    """
    stmt = select(BusinessLead).where(BusinessLead.id == lead_id)
    res = await db.execute(stmt)
    lead = res.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")

    lead_name = lead.name
    await db.delete(lead)
    await db.commit()

    return {
        "status": "success",
        "message": f"Lead '{lead_name}' successfully deleted.",
        "lead_id": lead_id
    }


@router.post("/batch-delete", response_model=Dict[str, Any])
async def batch_delete_leads(
    payload: BatchDeleteRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Bulk deletes multiple leads from CRM pipeline by ID list.
    Safely removes all associated cascade relationships.
    """
    if not payload.lead_ids:
        raise HTTPException(status_code=400, detail="No lead IDs provided for deletion.")

    stmt = select(BusinessLead).where(BusinessLead.id.in_(payload.lead_ids))
    res = await db.execute(stmt)
    leads = res.scalars().all()

    if not leads:
        return {
            "status": "success",
            "deleted_count": 0,
            "lead_ids": [],
            "message": "No matching leads found for deletion."
        }

    deleted_ids = []
    for lead in leads:
        deleted_ids.append(lead.id)
        await db.delete(lead)

    await db.commit()

    return {
        "status": "success",
        "deleted_count": len(deleted_ids),
        "lead_ids": deleted_ids,
        "message": f"Successfully deleted {len(deleted_ids)} lead(s) from CRM pipeline."
    }


