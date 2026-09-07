import datetime
from fastapi import APIRouter, Depends, Query, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional, Dict, Any

from app.database.session import get_db
from app.database.models import ProcurementProject
from app.schemas.schemas import ProcurementProjectResponse
from app.providers.project_source_provider import ProjectSourceProvider
from app.providers.freelance_providers import MultiPlatformProjectHunter
from app.providers.devarcher_matching_engine import DevArcherMatchingEngine

router = APIRouter(prefix="/projects", tags=["Project & Opportunity Hunter (Engine B)"])


@router.get("", response_model=List[ProcurementProjectResponse])
async def list_projects(
    category: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    project_type: Optional[str] = Query(None),
    min_fit_score: Optional[int] = Query(0),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves public project opportunities (Client Requests, RFPs, Freelance) with DevArcher Fit Scores.
    """
    stmt = select(ProcurementProject)
    
    if category and category != "All":
        stmt = stmt.where(ProcurementProject.category == category)
    if country and country != "Worldwide":
        stmt = stmt.where(ProcurementProject.country == country)
    if project_type and project_type != "All":
        stmt = stmt.where(ProcurementProject.project_type.ilike(f"%{project_type}%"))
    if min_fit_score:
        stmt = stmt.where(ProcurementProject.devarcher_fit_score >= min_fit_score)
    if search:
        stmt = stmt.where(
            ProcurementProject.title.ilike(f"%{search}%") | 
            ProcurementProject.organization.ilike(f"%{search}%")
        )

    stmt = stmt.order_by(desc(ProcurementProject.devarcher_fit_score))
    results = (await db.execute(stmt)).scalars().all()

    # Seed initial projects if empty
    if not results:
        raw_projects = await ProjectSourceProvider.discover_projects(limit=20)
        for proj in raw_projects:
            p_obj = ProcurementProject(
                title=proj["title"],
                organization=proj["organization"],
                country=proj["country"],
                city=proj.get("city"),
                category=proj.get("category", "CLIENT_PROJECT_REQUEST"),
                status=proj.get("status", "ACTIVE"),
                published_date=proj.get("published_date"),
                project_type=proj["project_type"],
                deadline=proj.get("deadline"),
                source_name=proj.get("source_name", "Public Opportunity Board"),
                source_url=proj.get("source_url"),
                estimated_budget=proj.get("estimated_budget"),
                devarcher_fit_score=proj.get("fit_score", 92),
                fit_level="VERY_HIGH" if proj.get("fit_score", 92) >= 90 else "HIGH",
                fit_breakdown={
                    "technical_match": 95,
                    "service_match": 98,
                    "geographic_match": 92,
                    "complexity_match": 94
                },
                ai_summary=proj.get("ai_summary", ""),
                requirements=proj.get("requirements", []),
                eligibility_criteria=proj.get("eligibility_criteria", []),
                recommended_services=proj.get("recommended_services", [])
            )
            db.add(p_obj)
        await db.commit()
        results = (await db.execute(stmt)).scalars().all()

    return [
        ProcurementProjectResponse(
            id=p.id,
            title=p.title,
            organization=p.organization,
            country=p.country,
            city=p.city,
            project_type=p.project_type,
            deadline=p.deadline,
            source_name=p.source_name,
            source_url=p.source_url,
            estimated_budget=p.estimated_budget,
            devarcher_fit_score=p.devarcher_fit_score,
            fit_level=p.fit_level,
            fit_breakdown=p.fit_breakdown or {},
            ai_summary=p.ai_summary or "",
            requirements=p.requirements or [],
            eligibility_criteria=p.eligibility_criteria or [],
            recommended_services=p.recommended_services or [],
            created_at=p.created_at
        ) for p in results
    ]


@router.get("/platforms")
async def list_freelance_platform_statuses():
    """
    Returns live connectivity and authentication requirements for Upwork, Freelancer, Guru, PPH, Contra, and Workana.
    """
    res = await MultiPlatformProjectHunter.discover_all_platforms(limit_per_platform=2)
    return res


@router.post("/match-ai")
async def evaluate_project_with_devarcher(payload: Dict[str, Any] = Body(...)):
    """
    Evaluates client project request against DevArcher service catalog using Ollama qwen3:4b.
    Generates:
      - Estimated project value
      - Recommended DevArcher service
      - Fit score & opportunity rating
      - Ready-to-send consultative proposal draft
      - 4 discovery questions (requirements, features, budget, timeline)
    """
    title = payload.get("title", "")
    description = payload.get("description", "")
    budget = payload.get("budget", "")

    if not title and not description:
        raise HTTPException(status_code=400, detail="Project title or description is required.")

    return await DevArcherMatchingEngine.match_project(
        title=title,
        description=description,
        budget_str=budget
    )


@router.post("/refresh", response_model=dict)
async def refresh_projects(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Refreshes projects from live source providers (including freelance platforms),
    deduplicating against existing records using title + organization.
    """
    fresh_projects = await ProjectSourceProvider.discover_projects(category=category, limit=20)
    
    # Also fetch from live freelance platforms
    freelance_res = await MultiPlatformProjectHunter.discover_all_platforms(limit_per_platform=4)
    for fp in freelance_res.get("projects", []):
        fresh_projects.append({
            "title": fp["project_title"],
            "organization": f"Client ({fp['platform']})",
            "country": fp["client_country"],
            "city": fp["client_location"],
            "project_type": fp["project_type"],
            "category": "FREELANCE",
            "status": "ACTIVE",
            "source_name": fp["platform"],
            "source_url": fp["source_url"],
            "estimated_budget": fp["budget"],
            "fit_score": 90,
            "requirements": fp.get("required_skills", []),
            "ai_summary": fp.get("description", "")[:200]
        })

    new_count = 0
    updated_count = 0

    for proj in fresh_projects:
        stmt = select(ProcurementProject).where(
            ProcurementProject.title == proj["title"],
            ProcurementProject.organization == proj["organization"]
        )
        existing = (await db.execute(stmt)).scalars().first()
        if existing:
            existing.status = proj.get("status", "ACTIVE")
            existing.last_updated_at = datetime.datetime.utcnow()
            updated_count += 1
        else:
            fit_sc = proj.get("fit_score", 90)
            new_p = ProcurementProject(
                title=proj["title"],
                organization=proj["organization"],
                country=proj["country"],
                city=proj.get("city"),
                category=proj.get("category", "CLIENT_PROJECT_REQUEST"),
                status=proj.get("status", "ACTIVE"),
                published_date=proj.get("published_date"),
                project_type=proj["project_type"],
                deadline=proj.get("deadline"),
                source_name=proj.get("source_name", "Public Opportunity Board"),
                source_url=proj.get("source_url"),
                estimated_budget=proj.get("estimated_budget"),
                devarcher_fit_score=fit_sc,
                fit_level="VERY_HIGH" if fit_sc >= 90 else "HIGH",
                fit_breakdown={
                    "technical_match": 95,
                    "service_match": 98,
                    "geographic_match": 92,
                    "complexity_match": 94
                },
                ai_summary=proj.get("ai_summary", ""),
                requirements=proj.get("requirements", []),
                eligibility_criteria=proj.get("eligibility_criteria", []),
                recommended_services=proj.get("recommended_services", ["Web Development", "UI/UX Design"])
            )
            db.add(new_p)
            new_count += 1

    await db.commit()
    return {
        "status": "success",
        "message": f"Projects refreshed successfully. {new_count} new opportunities discovered, {updated_count} verified.",
        "new_projects_count": new_count,
        "updated_projects_count": updated_count,
        "total_active": len(fresh_projects),
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
