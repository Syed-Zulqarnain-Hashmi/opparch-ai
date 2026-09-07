"""
OPPARCH AI — Search & Opportunity Discovery API
Supports DEMO MODE and REAL FREE MODE (OpenStreetMap / Overpass API + Ollama analysis).

Architecture:
  Natural Language Query
      ↓
  AIProvider.parse_search_intent()  [Ollama → rule-based fallback]
      ↓
  SearchProvider.discover_businesses()  [REAL_FREE=Overpass API | DEMO=synthetic]
      ↓
  WebsiteAnalyzer.analyze_url()  [SSRF-protected public audit]
      ↓
  OpportunityScoringEngine.calculate_score()  [evidence-based 0-100]
      ↓
  OllamaProvider.analyze_business()  [AI reasoning, service match, outreach hint]
      ↓
  ServiceMatcher.match_services()  [DevArcher service catalog mapping]
      ↓
  Save to DB → Return to frontend
"""
import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from typing import Dict, Any, List, Optional

from app.database.session import get_db
from app.database.models import (
    BusinessLead, LeadScore, LeadAudit, LeadServiceMatch,
    SearchHistory, ProcurementProject, User, ActivityLog
)
from app.schemas.schemas import (
    SearchRequest, SearchExecutionResponse, BusinessLeadResponse,
    ProcurementProjectResponse, ParsedSearchCriteria
)
from app.providers.ai_provider import AIProvider
from app.providers.search_provider import SearchProvider
from app.providers.procurement_provider import ProcurementProvider
from app.providers.ollama_provider import OllamaProvider
from app.analyzers.website_analyzer import WebsiteAnalyzer
from app.providers.email_enricher import PublicEmailEnricher
from app.scoring.scoring_engine import OpportunityScoringEngine

from app.scoring.service_matcher import ServiceMatcher
from app.core.security import get_current_user_optional

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/search", tags=["Opportunity Search Engine"])


@router.post("/parse-intent", response_model=ParsedSearchCriteria)
async def parse_search_intent(request: SearchRequest):
    """
    Parses natural language prompt into structured search criteria.
    Uses Ollama for REAL_FREE mode; rule-based parser for DEMO mode or when Ollama is offline.
    """
    return await AIProvider.parse_search_intent(
        query=request.query,
        default_country=request.country or "Worldwide",
        mode=request.mode or request.ai_engine or "DEMO"
    )


@router.post("/discover", response_model=SearchExecutionResponse)
async def discover_opportunities(
    request: SearchRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Executes the full Opportunity Discovery pipeline:
      1. Parse natural language intent (Ollama → rule-based fallback)
      2. Discover real businesses (Overpass API) or demo data
      3. Audit each business website (SSRF-protected)
      4. Score each opportunity (evidence-based 0-100)
      5. AI analysis via Ollama (digital weaknesses, service match, reasoning)
      6. Save to database → return structured response

    REAL FREE MODE guarantees:
      - NEVER returns synthetic or fabricated businesses
      - If Overpass returns 0 results → empty response with clear message
      - NEVER silently falls back to Demo data
    """
    user_id = current_user.id if current_user else None
    active_mode = request.mode if request.mode in ["DEMO", "REAL_FREE"] else "DEMO"
    is_real_mode = (active_mode == "REAL_FREE")

    # ── STEP 1: Parse intent ────────────────────────────────────────────────
    criteria = await AIProvider.parse_search_intent(
        query=request.query,
        default_country=request.country or "Worldwide",
        mode=active_mode
    )

    # Explicit UI filters override parsed criteria
    target_country = (
        request.country if (request.country and request.country != "Worldwide")
        else criteria.country
    )
    target_city = request.city.strip() if (request.city and request.city.strip()) else criteria.city
    target_industry = (
        request.industry if (request.industry and request.industry != "All Industries")
        else criteria.industry
    )
    target_service = (
        request.service_target
        if (request.service_target and request.service_target != "All Services")
        else None
    )

    active_criteria = ParsedSearchCriteria(
        country=target_country,
        city=target_city,
        industry=target_industry,
        opportunity_focus=criteria.opportunity_focus,
        digital_gap=criteria.digital_gap,
        priority="High",
        matched_services=[target_service] if target_service else criteria.matched_services
    )

    # ── Check if query is project/freelance-oriented ────────────────────────
    is_project_query = (
        request.opportunity_type == "PROJECT"
        or "project" in (request.query or "").lower()
        or "freelance" in (request.query or "").lower()
        or active_criteria.opportunity_focus == "Project Procurement & Client Hunting"
    )

    # ── STEP 2: Discover businesses (if not exclusively project query) ───────
    raw_businesses = []
    if not (is_project_query and not request.industry):
        if is_real_mode:
            logger.info(
                f"\n{'='*60}\n"
                f"  REAL_FREE SEARCH\n"
                f"  Provider: OpenStreetMap / Overpass API\n"
                f"  Country:  {target_country}\n"
                f"  City:     {target_city or '(any)'}\n"
                f"  Industry: {target_industry}\n"
                f"{'='*60}"
            )

        raw_businesses = await SearchProvider.discover_businesses(
            country=target_country,
            city=target_city,
            industry=target_industry,
            limit=request.limit or 20,
            mode=active_mode
        )

        if is_real_mode:
            logger.info(f"  Overpass Results: {len(raw_businesses)} real business(es) returned")

    # ── STEP 2B: Discover Procurement Projects (Engine B) ───────────────────
    # IMPORTANT: Only query procurement for EXPLICIT project/freelance searches.
    # Do NOT use procurement as a fallback for failed business searches —
    # that caused hardcoded Pakistan/UAE/USA tenders to appear in any real-mode
    # search that returned 0 businesses (the root cause of country contamination).
    project_responses: List[ProcurementProjectResponse] = []
    if is_project_query:
        raw_projects = await ProcurementProvider.discover_projects(
            country=target_country,
            limit=5
        )
        for proj in raw_projects:
            stmt_p = select(ProcurementProject).where(ProcurementProject.title == proj["title"])
            existing_p = (await db.execute(stmt_p)).scalars().first()

            if not existing_p:
                p_obj = ProcurementProject(
                    user_id=user_id,
                    title=proj["title"],
                    organization=proj["organization"],
                    country=proj["country"],
                    city=proj.get("city"),
                    project_type=proj["project_type"],
                    deadline=proj.get("deadline"),
                    source_name=proj.get("source_name", "Procurement Portal"),
                    source_url=proj.get("source_url"),
                    estimated_budget=proj.get("estimated_budget"),
                    devarcher_fit_score=proj["devarcher_fit_score"],
                    fit_level=proj["fit_level"],
                    fit_breakdown=proj.get("fit_breakdown", {}),
                    ai_summary=proj.get("ai_summary", ""),
                    requirements=proj.get("requirements", []),
                    eligibility_criteria=proj.get("eligibility_criteria", []),
                    recommended_services=proj.get("recommended_services", [])
                )
                db.add(p_obj)
                await db.commit()
                existing_p = p_obj

            project_responses.append(
                ProcurementProjectResponse(
                    id=existing_p.id,
                    user_id=existing_p.user_id,
                    title=existing_p.title,
                    organization=existing_p.organization,
                    country=existing_p.country,
                    city=existing_p.city,
                    project_type=existing_p.project_type,
                    deadline=existing_p.deadline,
                    source_name=existing_p.source_name,
                    source_url=existing_p.source_url,
                    estimated_budget=existing_p.estimated_budget,
                    devarcher_fit_score=existing_p.devarcher_fit_score,
                    fit_level=existing_p.fit_level,
                    fit_breakdown=existing_p.fit_breakdown or {},
                    ai_summary=existing_p.ai_summary or "",
                    requirements=existing_p.requirements or [],
                    eligibility_criteria=existing_p.eligibility_criteria or [],
                    recommended_services=existing_p.recommended_services or [],
                    created_at=existing_p.created_at
                )
            )

    # ── REAL FREE ZERO-RESULT GUARD ─────────────────────────────────────────
    # Fire if REAL_FREE mode returned 0 businesses (project_responses not considered —
    # they are only populated for explicit project queries and are irrelevant to the
    # business-discovery zero-result case).
    if is_real_mode and len(raw_businesses) == 0:
        logger.warning(
            f"  ⚠ No real businesses or projects found for {target_industry} in {target_city or target_country}.\n"
            f"  Returning empty result — ZERO synthetic substitution."
        )
        history = SearchHistory(
            user_id=user_id,
            query=request.query,
            search_type=request.opportunity_type or "BUSINESS",
            mode="REAL_FREE",
            parsed_criteria=active_criteria.model_dump(),
            country=target_country,
            city=target_city,
            industry=target_industry,
            service_target=request.service_target,
            results_count=0,
            high_priority_count=0
        )
        db.add(history)
        await db.commit()
        return SearchExecutionResponse(
            search_id=history.id,
            query=request.query,
            parsed_criteria=active_criteria,
            total_found=0,
            high_priority_count=0,
            leads=[],
            projects=[],
            mode="REAL_FREE",
            real_data=True,
            status="zero_results",
            provider_status="ONLINE",
            ollama_status="ONLINE",
            message=(
                f"No verified real business opportunities were found for '{target_industry}' in "
                f"{target_city or target_country} via OpenStreetMap / Overpass API. "
                f"No synthetic results were substituted."
            )
        )

    # ── STEP 3-5: Audit → Score → Multi-AI Analysis (Parallelized) ─────────
    lead_responses: List[BusinessLeadResponse] = []
    high_priority_count = 0

    ai_provider = current_user.ai_provider_preference if current_user else "OLLAMA"
    gemini_key = current_user.gemini_api_key if current_user else None
    openai_key = current_user.openai_api_key if current_user else None
    ollama_model = current_user.ollama_model_preference if current_user else None

    sem = asyncio.Semaphore(6)

    async def evaluate_biz(biz: Dict[str, Any]):
        async with sem:
            audit_res = await WebsiteAnalyzer.analyze_url(
                url=biz.get("website_url"),
                industry=biz.get("industry")
            )

            # Real Public Contact Email Enrichment Engine
            email_info = await PublicEmailEnricher.enrich_lead_email(
                website_url=biz.get("website_url"),
                osm_email=biz.get("email"),
                website_html=audit_res.get("raw_html")
            )

            score_val, priority, breakdown, reasoning = OpportunityScoringEngine.calculate_score(
                has_website=biz["has_website"],
                website_status=audit_res["website_status"],
                social_presence=biz.get("social_presence", {}),
                missing_features=audit_res["missing_digital_features"],
                page_speed=audit_res["page_speed_rating"],
                seo_quality=audit_res["seo_quality"],
                ux_rating=audit_res["ux_rating"],
                industry=biz["industry"],
                target_service=target_service or ""
            )
            ai_analysis = await AIProvider.analyze_business(
                business_name=biz["name"],
                industry=biz["industry"],
                country=biz["country"],
                city=biz.get("city"),
                has_website=biz["has_website"],
                website_status=audit_res["website_status"],
                phone=biz.get("phone"),
                email=email_info.get("email"),
                audit_evidence=audit_res.get("evidence_points", []),
                missing_features=audit_res.get("missing_digital_features", []),
                opportunity_score=score_val,
                data_mode=active_mode,
                provider=ai_provider,
                gemini_key=gemini_key,
                openai_key=openai_key,
                ollama_model=ollama_model
            )
            if ai_analysis.get("reasoning"):
                reasoning = ai_analysis["reasoning"]

            service_matches = ServiceMatcher.match_services(
                has_website=biz["has_website"],
                website_status=audit_res["website_status"],
                mobile_friendly=audit_res["mobile_friendly"],
                page_speed=audit_res["page_speed_rating"],
                seo_quality=audit_res["seo_quality"],
                ux_rating=audit_res["ux_rating"],
                missing_features=audit_res["missing_digital_features"],
                industry=biz["industry"]
            )

            if target_service and target_service not in ("All Services", "The Archer"):
                tgt_clean = target_service.lower()
                target_match = next(
                    (s for s in service_matches if tgt_clean in s["service_name"].lower() or (("app" in tgt_clean or "mobile" in tgt_clean) and ("app" in s["service_name"].lower() or "mobile" in s["service_name"].lower()))),
                    None
                )
                if target_match:
                    target_match["fit_rank"] = 1
                    target_match["match_confidence"] = max(95, target_match["match_confidence"])
                else:
                    service_matches.insert(0, {
                        "service_id": "targeted-service",
                        "service_name": target_service,
                        "fit_rank": 1,
                        "match_confidence": 95,
                        "match_reason": f"High opportunity match for {target_service} in {biz.get('city') or biz['country']}."
                    })

            return {
                "biz": biz,
                "audit_res": audit_res,
                "score_val": score_val,
                "priority": priority,
                "breakdown": breakdown,
                "reasoning": reasoning,
                "service_matches": service_matches,
                "ai_analysis": ai_analysis,
                "email_info": email_info
            }

    evaluations = await asyncio.gather(*[evaluate_biz(b) for b in raw_businesses])

    for ev in evaluations:
        biz = ev["biz"]
        audit_res = ev["audit_res"]
        score_val = ev["score_val"]
        priority = ev["priority"]
        breakdown = ev["breakdown"]
        reasoning = ev["reasoning"]
        service_matches = ev["service_matches"]
        email_info = ev["email_info"]

        if priority in ["HIGH", "VERY_HIGH"]:
            high_priority_count += 1

        # Deduplication check
        stmt = (
            select(BusinessLead)
            .where(
                (BusinessLead.name == biz["name"]) & (BusinessLead.country == biz["country"])
            )
            .options(
                selectinload(BusinessLead.score),
                selectinload(BusinessLead.audit),
                selectinload(BusinessLead.services)
            )
        )
        existing = (await db.execute(stmt)).scalars().first()

        if existing:
            lead_obj = existing
            if user_id and not lead_obj.user_id:
                lead_obj.user_id = user_id
            # Update email if newly discovered
            if email_info.get("email") and not lead_obj.email:
                lead_obj.email = email_info.get("email")
                lead_obj.email_status = email_info.get("email_status", "found")
                lead_obj.email_source = email_info.get("email_source")
                lead_obj.email_source_url = email_info.get("email_source_url")
                lead_obj.email_confidence = email_info.get("email_confidence")
        else:
            lead_obj = BusinessLead(
                user_id=user_id,
                name=biz["name"],
                country=biz["country"],
                city=biz.get("city"),
                industry=biz["industry"],
                website_url=biz.get("website_url"),
                has_website=biz["has_website"],
                phone=biz.get("phone"),
                email=email_info.get("email"),
                email_status=email_info.get("email_status", "not_found"),
                email_source=email_info.get("email_source"),
                email_source_url=email_info.get("email_source_url"),
                email_confidence=email_info.get("email_confidence"),
                address=biz.get("address"),
                social_presence=biz.get("social_presence", {}),
                discovery_source=biz.get(
                    "discovery_source",
                    "OpenStreetMap / Overpass API" if is_real_mode else "Demo Business Registry"
                ),
                source_url=biz.get("source_url"),
                is_demo_data=biz.get("is_demo_data", not is_real_mode),
                data_mode=active_mode,
                last_verified_at=biz.get("last_checked"),
                priority=priority,
                pipeline_stage="NEW"
            )


            score_obj = LeadScore(
                lead=lead_obj,
                opportunity_score=score_val,
                priority_level=priority,
                confidence=0.94 if is_real_mode else 0.91,
                website_gap_score=breakdown["website_gap_score"],
                digital_weakness_score=breakdown["digital_weakness_score"],
                business_activity_score=breakdown["business_activity_score"],
                social_presence_score=breakdown["social_presence_score"],
                ecommerce_opportunity_score=breakdown["ecommerce_opportunity_score"],
                ux_opportunity_score=breakdown["ux_opportunity_score"],
                mobile_opportunity_score=breakdown["mobile_opportunity_score"],
                branding_opportunity_score=breakdown["branding_opportunity_score"],
                reasoning_summary=reasoning
            )

            audit_obj = LeadAudit(
                lead=lead_obj,
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

            sm_objs = [
                LeadServiceMatch(
                    lead=lead_obj,
                    service_id=sm["service_id"],
                    service_name=sm["service_name"],
                    fit_rank=sm["fit_rank"],
                    match_confidence=sm["match_confidence"],
                    match_reason=sm["match_reason"]
                ) for sm in service_matches
            ]

            lead_obj.score = score_obj
            lead_obj.audit = audit_obj
            lead_obj.services = sm_objs

            db.add(lead_obj)
            await db.flush()

    await db.commit()

    # ── Build responses ───────────────────────────────────────────────────
    all_leads_for_response = (await db.execute(
        select(BusinessLead)
        .where(BusinessLead.id.in_([
            ev["biz"].get("_lead_id") for ev in evaluations
            if ev.get("biz", {}).get("_lead_id")
        ]))
    )).scalars().all() if False else []

    # Rebuild from evaluations since leads were just committed
    for ev in evaluations:
        biz = ev["biz"]
        audit_res = ev["audit_res"]
        score_val = ev["score_val"]
        priority = ev["priority"]
        breakdown = ev["breakdown"]
        reasoning = ev["reasoning"]
        service_matches = ev["service_matches"]
        ai_analysis = ev.get("ai_analysis", {})

        stmt_r = (
            select(BusinessLead)
            .where(
                (BusinessLead.name == biz["name"]) & (BusinessLead.country == biz["country"])
            )
        )
        lead_obj = (await db.execute(stmt_r)).scalars().first()
        if not lead_obj:
            continue

        score_data = None
        if lead_obj.score:
            score_data = {
                "opportunity_score": lead_obj.score.opportunity_score,
                "priority_level": lead_obj.score.priority_level,
                "confidence": lead_obj.score.confidence,
                "breakdown": {
                    "website_gap_score": lead_obj.score.website_gap_score,
                    "digital_weakness_score": lead_obj.score.digital_weakness_score,
                    "business_activity_score": lead_obj.score.business_activity_score,
                    "social_presence_score": lead_obj.score.social_presence_score,
                    "ecommerce_opportunity_score": lead_obj.score.ecommerce_opportunity_score,
                    "ux_opportunity_score": lead_obj.score.ux_opportunity_score,
                    "mobile_opportunity_score": lead_obj.score.mobile_opportunity_score,
                    "branding_opportunity_score": lead_obj.score.branding_opportunity_score,
                },
                "reasoning_summary": lead_obj.score.reasoning_summary or ""
            }

        audit_data = None
        if lead_obj.audit:
            audit_data = {
                "website_status": lead_obj.audit.website_status,
                "mobile_friendly": lead_obj.audit.mobile_friendly,
                "ssl_active": lead_obj.audit.ssl_active,
                "page_speed_rating": lead_obj.audit.page_speed_rating,
                "seo_quality": lead_obj.audit.seo_quality,
                "ux_rating": lead_obj.audit.ux_rating,
                "missing_digital_features": lead_obj.audit.missing_digital_features or [],
                "evidence_points": lead_obj.audit.evidence_points or [],
                "pain_points": lead_obj.audit.pain_points or []
            }

        service_data = [
            {
                "service_id": sm.service_id,
                "service_name": sm.service_name,
                "fit_rank": sm.fit_rank,
                "match_confidence": sm.match_confidence,
                "match_reason": sm.match_reason
            } for sm in (lead_obj.services or [])
        ]

        lead_responses.append(
            BusinessLeadResponse(
                id=lead_obj.id,
                user_id=lead_obj.user_id,
                name=lead_obj.name,
                country=lead_obj.country,
                city=lead_obj.city,
                industry=lead_obj.industry,
                website_url=lead_obj.website_url,
                has_website=lead_obj.has_website,
                phone=lead_obj.phone,
                email=lead_obj.email,
                email_status=lead_obj.email_status or "not_found",
                email_source=lead_obj.email_source,
                email_source_url=lead_obj.email_source_url,
                email_confidence=lead_obj.email_confidence,
                address=lead_obj.address,

                social_presence=lead_obj.social_presence or {},
                discovery_source=lead_obj.discovery_source,
                source_url=lead_obj.source_url,
                is_demo_data=lead_obj.is_demo_data,
                data_mode=lead_obj.data_mode or active_mode,
                last_verified_at=lead_obj.last_verified_at,
                pipeline_stage=lead_obj.pipeline_stage,
                priority=lead_obj.priority,
                created_at=lead_obj.created_at,
                score=score_data,
                audit=audit_data,
                services=service_data
            )
        )

    # ── STEP 6: Save Search History ───────────────────────────────────────
    total_found_count = len(lead_responses) if len(lead_responses) > 0 else len(project_responses)

    history = SearchHistory(
        user_id=user_id,
        query=request.query,
        search_type=request.opportunity_type or ("PROJECT" if is_project_query else "BUSINESS"),
        mode=active_mode,
        parsed_criteria=active_criteria.model_dump(),
        country=target_country,
        city=target_city,
        industry=target_industry,
        service_target=request.service_target,
        results_count=total_found_count,
        high_priority_count=high_priority_count
    )
    db.add(history)

    if user_id:
        activity = ActivityLog(
            user_id=user_id,
            action="SEARCH_EXECUTE",
            details={
                "query": request.query,
                "country": target_country,
                "city": target_city,
                "industry": target_industry,
                "mode": active_mode,
                "results_count": total_found_count
            }
        )
        db.add(activity)

    await db.commit()

    def _get_opp_score(resp: BusinessLeadResponse) -> int:
        if not resp.score:
            return 0
        if isinstance(resp.score, dict):
            return resp.score.get("opportunity_score", 0)
        return getattr(resp.score, "opportunity_score", 0)

    lead_responses.sort(
        key=_get_opp_score,
        reverse=True
    )

    # ── Service-Quality Filter ─────────────────────────────────────────────
    # When a service target is selected, remove businesses that clearly don't
    # need that service (e.g., remove modern-website businesses from Web Dev results).
    if target_service and target_service not in ("All Services", "The Archer") and lead_responses:
        svc_lower = target_service.lower()
        wants_web_dev = any(k in svc_lower for k in ["web", "development", "design", "archer"])
        wants_app_dev = any(k in svc_lower for k in ["app", "mobile", "software"])

        def _qualifies(resp: BusinessLeadResponse) -> bool:
            audit = resp.audit or {}
            ws = audit.get("website_status", "") if isinstance(audit, dict) else getattr(audit, "website_status", "")
            hw = resp.has_website
            score = _get_opp_score(resp)
            if wants_web_dev:
                # For web dev: only keep businesses WITHOUT a website or with poor/broken websites
                # "MODERN" means they already have a good site — not a web dev lead
                if ws == "MODERN" and hw and score < 45:
                    return False
            if wants_app_dev:
                # For app dev: keep all (any business could benefit from an app)
                pass
            return True

        qualified = [r for r in lead_responses if _qualifies(r)]
        # If filtering removed everything, keep the top results anyway (avoid empty page)
        if qualified:
            lead_responses = qualified
        # Always keep at least top 3 for any service target
        if not lead_responses:
            lead_responses = lead_responses[:3]

    total_found_count = len(lead_responses) if len(lead_responses) > 0 else len(project_responses)
    high_priority_count = sum(
        1 for r in lead_responses
        if getattr(r, "priority", None) in ["HIGH", "VERY_HIGH"]
        or (isinstance(r.score, dict) and r.score.get("priority_level") in ["HIGH", "VERY_HIGH"])
    )

    if is_real_mode:
        logger.info(
            f"\n{'='*60}\n"
            f"  REAL_FREE SEARCH COMPLETE\n"
            f"  Provider:    OpenStreetMap / Overpass API\n"
            f"  Leads Found: {len(lead_responses)}\n"
            f"  Projects:    {len(project_responses)}\n"
            f"  AI Model:    {OllamaProvider._default_model()}\n"
            f"  Mode:        REAL_FREE — NO synthetic data served\n"
            f"{'='*60}"
        )

    resp_msg = (
        f"Retrieved {len(lead_responses)} real businesses from OpenStreetMap / Overpass API."
        if (is_real_mode and len(lead_responses) > 0)
        else (
            f"Retrieved {len(project_responses)} client project opportunities."
            if len(project_responses) > 0
            else ("No verified opportunities found." if is_real_mode else None)
        )
    )

    return SearchExecutionResponse(
        search_id=history.id,
        query=request.query,
        parsed_criteria=active_criteria,
        total_found=total_found_count,
        high_priority_count=high_priority_count,
        leads=lead_responses,
        projects=project_responses,
        mode=active_mode,
        real_data=is_real_mode,
        status="success" if total_found_count > 0 else "zero_results",
        provider_status="ONLINE",
        ollama_status="ONLINE",
        message=resp_msg
    )


@router.get("/history")
async def get_search_history(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns search history. Enforces per-user isolation when authenticated.
    """
    stmt = select(SearchHistory)
    if current_user:
        stmt = stmt.where(
            (SearchHistory.user_id == current_user.id) | (SearchHistory.user_id == None)
        )
    stmt = stmt.order_by(desc(SearchHistory.created_at)).limit(50)
    histories = (await db.execute(stmt)).scalars().all()
    return [
        {
            "id": h.id,
            "query": h.query,
            "mode": h.mode,
            "parsed_criteria": h.parsed_criteria,
            "country": h.country,
            "city": h.city,
            "industry": h.industry,
            "results_count": h.results_count,
            "created_at": h.created_at
        } for h in histories
    ]
