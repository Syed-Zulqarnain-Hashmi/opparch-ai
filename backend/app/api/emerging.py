from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.database.session import get_db
from app.database.models import EmergingOpportunity
from app.schemas.schemas import EmergingOpportunityResponse

router = APIRouter(prefix="/emerging", tags=["Emerging Opportunity Signals"])

DEFAULT_EMERGING_OPPORTUNITIES = [
    {
        "country": "Pakistan",
        "industry": "Healthcare",
        "opportunity_name": "Online Medical Appointment & Prescription Platforms",
        "description": "Rising urban patient volume in Islamabad, Lahore, and Karachi is creating huge demand for digital scheduling and telemedicine solutions among private clinics.",
        "estimated_potential_businesses": 45,
        "recommended_devarcher_solution": "Healthcare Booking Portal & Patient Management System",
        "growth_signal": "VERY_HIGH",
        "evidence_signals": [
            "Over 65% of suburban private clinics lack digital booking systems.",
            "High search interest for 'online doctor appointment Islamabad/Lahore'."
        ]
    },
    {
        "country": "UAE",
        "industry": "Restaurants & Dining",
        "opportunity_name": "Direct-to-Consumer Food Ordering Portals",
        "description": "Restaurants in Dubai and Abu Dhabi seek custom web ordering platforms to eliminate 30% third-party aggregator delivery commission fees.",
        "estimated_potential_businesses": 60,
        "recommended_devarcher_solution": "Custom Web Ordering & Delivery System",
        "growth_signal": "VERY_HIGH",
        "evidence_signals": [
            "Strong customer demand for direct restaurant brand ordering.",
            "Desire by brand owners to retain 100% customer data and margins."
        ]
    },
    {
        "country": "USA",
        "industry": "Real Estate",
        "opportunity_name": "Interactive Virtual Property Showcase Websites",
        "description": "Mid-sized real estate agencies require high-speed, immersive web platforms with sub-second page performance to stand out.",
        "estimated_potential_businesses": 80,
        "recommended_devarcher_solution": "Full-Stack Real Estate Platform (Design + Code + SEO)",
        "growth_signal": "HIGH",
        "evidence_signals": [
            "Legacy real estate agency templates suffer from slow Core Web Vitals.",
            "Modern visual layout yields 2.4x higher lead conversion."
        ]
    }
]

@router.get("", response_model=List[EmergingOpportunityResponse])
async def get_emerging_opportunities(
    country: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(EmergingOpportunity)
    if country and country != "Worldwide":
        stmt = stmt.where(EmergingOpportunity.country == country)
    results = (await db.execute(stmt)).scalars().all()

    if not results:
        for item in DEFAULT_EMERGING_OPPORTUNITIES:
            obj = EmergingOpportunity(**item)
            db.add(obj)
        await db.commit()
        results = (await db.execute(stmt)).scalars().all()

    return [
        EmergingOpportunityResponse(
            id=item.id,
            country=item.country,
            industry=item.industry,
            opportunity_name=item.opportunity_name,
            description=item.description,
            estimated_potential_businesses=item.estimated_potential_businesses,
            recommended_devarcher_solution=item.recommended_devarcher_solution,
            growth_signal=item.growth_signal,
            evidence_signals=item.evidence_signals or []
        ) for item in results
    ]
