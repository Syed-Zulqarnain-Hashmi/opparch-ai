from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Dict, Any, Optional

from app.database.session import get_db
from app.database.models import BusinessLead, User
from app.schemas.schemas import CRMUpdateRequest, BusinessLeadResponse
from app.api.leads import format_lead_response
from app.core.security import get_current_user_optional

router = APIRouter(prefix="/crm", tags=["CRM Pipeline Management"])

STAGES = [
    "NEW", "RESEARCHING", "READY_FOR_OUTREACH", "CONTACTED",
    "REPLIED", "INTERESTED", "MEETING", "PROPOSAL", "WON", "LOST"
]

@router.get("/pipeline")
async def get_crm_pipeline(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, List[BusinessLeadResponse]]:
    """
    Returns pipeline deals organized by stage for Kanban board view.
    Enforces user data isolation.
    """
    stmt = (
        select(BusinessLead)
        .options(
            selectinload(BusinessLead.score),
            selectinload(BusinessLead.audit),
            selectinload(BusinessLead.services)
        )
    )

    if current_user:
        stmt = stmt.where((BusinessLead.user_id == current_user.id) | (BusinessLead.user_id == None))

    stmt = stmt.order_by(BusinessLead.created_at.desc())
    leads = (await db.execute(stmt)).scalars().all()

    pipeline: Dict[str, List[BusinessLeadResponse]] = {stage: [] for stage in STAGES}
    for lead in leads:
        st = (lead.pipeline_stage or "NEW").replace(" ", "_").upper()
        stage = st if st in pipeline else "NEW"
        pipeline[stage].append(format_lead_response(lead))

    return pipeline


def normalize_stage(stage_raw: Optional[str]) -> Optional[str]:
    if not stage_raw:
        return None
    s = stage_raw.strip().upper().replace(" ", "_").replace("-", "_")
    if s in ["RESEARCH", "RESEARCHING", "IN_RESEARCH"]:
        return "RESEARCHING"
    if s in ["NEW", "DISCOVERED"]:
        return "NEW"
    if s in ["READY", "READY_FOR_OUTREACH", "OUTREACH_READY"]:
        return "READY_FOR_OUTREACH"
    if s in ["CONTACTED", "OUTREACH_SENT"]:
        return "CONTACTED"
    if s in ["REPLY", "REPLIED"]:
        return "REPLIED"
    if s in ["INTEREST", "INTERESTED"]:
        return "INTERESTED"
    if s in ["MEET", "MEETING"]:
        return "MEETING"
    if s in ["PROPOSAL", "PROPOSALS"]:
        return "PROPOSAL"
    if s in ["WIN", "WON"]:
        return "WON"
    if s in ["LOSS", "LOST"]:
        return "LOST"
    return s


@router.put("/leads/{lead_id}/stage", response_model=BusinessLeadResponse)
@router.patch("/leads/{lead_id}/stage", response_model=BusinessLeadResponse)
@router.put("/lead/{lead_id}/stage", response_model=BusinessLeadResponse)
@router.patch("/lead/{lead_id}/stage", response_model=BusinessLeadResponse)
@router.patch("/lead/{lead_id}", response_model=BusinessLeadResponse)
@router.put("/lead/{lead_id}", response_model=BusinessLeadResponse)
@router.patch("/leads/{lead_id}", response_model=BusinessLeadResponse)
@router.put("/leads/{lead_id}", response_model=BusinessLeadResponse)
async def update_crm_lead(
    lead_id: str,
    update_data: CRMUpdateRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Update lead stage, priority level, follow-up date, deal value, or internal notes.
    Supports /leads/{id}/stage, /lead/{id}/stage, and root lead updates across PUT and PATCH.
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

    if current_user and lead.user_id and lead.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden. You do not own this lead record.")

    target_stage = normalize_stage(update_data.pipeline_stage or update_data.stage)
    if target_stage:
        if target_stage not in STAGES:
            raise HTTPException(status_code=400, detail=f"Invalid stage '{target_stage}'. Allowed: {STAGES}")
        lead.pipeline_stage = target_stage

    if update_data.priority:
        lead.priority = update_data.priority

    if update_data.follow_up_date is not None:
        lead.follow_up_date = update_data.follow_up_date

    if update_data.internal_notes is not None:
        lead.internal_notes = update_data.internal_notes

    if update_data.deal_value is not None:
        lead.deal_value = update_data.deal_value

    if current_user and not lead.user_id:
        lead.user_id = current_user.id

    await db.commit()
    await db.refresh(lead)

    return format_lead_response(lead)
