import csv
import io
import os
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from typing import Optional

from app.database.session import get_db
from app.database.models import User, BusinessLead, ProcurementProject, CSVExport
from app.schemas.schemas import CSVExportResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/export", tags=["CSV Export Engine"])

EXPORT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "exports")
os.makedirs(EXPORT_DIR, exist_ok=True)

LEADS_CSV_HEADERS = [
    "Name", "Company/Business", "Platform", "Project/Service Category",
    "Country", "City", "Email", "Phone", "Website", "Source URL",
    "Opportunity Score", "Service Match", "CRM Status",
    "Data Mode", "Created At"
]


def _build_lead_row(lead, score_val: str, top_service: str, active_mode: str) -> list:
    return [
        lead.name,
        lead.name,
        lead.discovery_source or "OpenStreetMap",
        lead.industry or "Business",
        lead.country,
        lead.city or "",
        lead.email or "",
        lead.phone or "",
        lead.website_url or "",
        lead.source_url or "",
        score_val,
        top_service,
        lead.pipeline_stage or "NEW",
        "REAL" if not lead.is_demo_data else "DEMO",
        lead.created_at.strftime("%Y-%m-%d %H:%M:%S") if lead.created_at else ""
    ]


@router.get("/download-leads-csv")
async def download_direct_leads_csv(
    all_leads: Optional[bool] = Query(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Direct one-click CSV download of user leads.
    Columns: Name, Company, Platform, Project, Country, City, Email, Phone, Website, Source URL,
             Opportunity Score, Service Match, Status, Data Mode, Created At.
    """
    stmt = (
        select(BusinessLead)
        .options(
            selectinload(BusinessLead.score),
            selectinload(BusinessLead.audit),
            selectinload(BusinessLead.services)
        )
    )

    if current_user.role == "ADMIN" and all_leads:
        pass  # Admin downloads all
    else:
        stmt = stmt.where(
            (BusinessLead.user_id == current_user.id) | (BusinessLead.user_id == None)
        )

    stmt = stmt.order_by(desc(BusinessLead.created_at))
    leads = (await db.execute(stmt)).scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(LEADS_CSV_HEADERS)

    for lead in leads:
        score_val = str(lead.score.opportunity_score) if lead.score else "N/A"
        top_service = lead.services[0].service_name if lead.services else "Full-Stack Web Development"
        writer.writerow(_build_lead_row(lead, score_val, top_service, "REAL" if not lead.is_demo_data else "DEMO"))

    csv_content = output.getvalue()
    filename_prefix = "opparch_system_leads" if (current_user.role == "ADMIN" and all_leads) else f"opparch_leads_{current_user.id[:8]}"
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{filename_prefix}_{timestamp}.csv"

    export_obj = CSVExport(
        user_id=current_user.id,
        filename=filename,
        file_path=os.path.join(EXPORT_DIR, filename),
        search_query="Direct Leads CSV Export",
        record_count=len(leads)
    )
    db.add(export_obj)
    await db.commit()

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get("/download-projects-csv")
async def download_projects_csv(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Direct one-click CSV download of project leads (freelance & procurement).
    """
    stmt = select(ProcurementProject).order_by(desc(ProcurementProject.devarcher_fit_score))
    projects = (await db.execute(stmt)).scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Project Title", "Organization/Client", "Platform/Source",
        "Country", "City", "Project Type", "Budget",
        "Fit Score", "Fit Level", "AI Summary", "Source URL", "Status", "Created At"
    ])

    for p in projects:
        writer.writerow([
            p.title,
            p.organization or "",
            p.source_name or "Project Board",
            p.country or "",
            p.city or "",
            p.project_type or "",
            p.estimated_budget or "",
            p.devarcher_fit_score or "",
            p.fit_level or "",
            (p.ai_summary or "")[:200],
            p.source_url or "",
            p.status or "ACTIVE",
            p.created_at.strftime("%Y-%m-%d %H:%M:%S") if p.created_at else ""
        ])

    csv_content = output.getvalue()
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"opparch_projects_{timestamp}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.post("/csv", response_model=CSVExportResponse)
async def generate_csv_export(
    query: str = "All Opportunities",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generates downloadable CSV file with all required columns and REAL/DEMO tagging.
    """
    stmt = (
        select(BusinessLead)
        .options(
            selectinload(BusinessLead.score),
            selectinload(BusinessLead.audit),
            selectinload(BusinessLead.services)
        )
        .where(
            (BusinessLead.user_id == current_user.id) | (BusinessLead.user_id == None)
        )
        .order_by(desc(BusinessLead.created_at))
        .limit(500)
    )
    leads = (await db.execute(stmt)).scalars().all()

    if not leads:
        raise HTTPException(status_code=404, detail="No business leads found to export.")

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"opparch_leads_{current_user.id[:8]}_{timestamp}.csv"
    filepath = os.path.join(EXPORT_DIR, filename)

    with open(filepath, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(LEADS_CSV_HEADERS)
        for lead in leads:
            score_val = str(lead.score.opportunity_score) if lead.score else "N/A"
            top_service = lead.services[0].service_name if lead.services else "Full-Stack Web Development"
            writer.writerow(_build_lead_row(lead, score_val, top_service, "REAL" if not lead.is_demo_data else "DEMO"))

    export_obj = CSVExport(
        user_id=current_user.id,
        filename=filename,
        file_path=filepath,
        search_query=query,
        record_count=len(leads)
    )
    db.add(export_obj)
    await db.commit()
    await db.refresh(export_obj)

    return CSVExportResponse.model_validate(export_obj)


@router.get("/history", response_model=list[CSVExportResponse])
async def get_my_export_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(CSVExport).where(CSVExport.user_id == current_user.id).order_by(desc(CSVExport.created_at))
    exports = (await db.execute(stmt)).scalars().all()
    return [CSVExportResponse.model_validate(exp) for exp in exports]


@router.get("/download/{export_id}")
async def download_csv_file(
    export_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(CSVExport).where(CSVExport.id == export_id)
    export_record = (await db.execute(stmt)).scalar_one_or_none()

    if not export_record:
        raise HTTPException(status_code=404, detail="CSV Export record not found.")

    if export_record.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden. You do not own this export file.")

    if not os.path.exists(export_record.file_path):
        raise HTTPException(status_code=404, detail="Export file has been removed from disk.")

    return FileResponse(
        path=export_record.file_path,
        filename=export_record.filename,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{export_record.filename}"'}
    )
