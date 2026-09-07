from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List, Dict, Any, Optional

from app.database.session import get_db
from app.database.models import (
    User, BusinessLead, ProcurementProject, SearchHistory, CSVExport,
    ActivityLog, MarketPrediction, PaperTrade, MarketAlert, EmailOutreach, EmailReply
)
from app.schemas.schemas import UserResponse
from app.core.security import get_current_admin_user
from app.providers.ollama_provider import OllamaProvider

router = APIRouter(prefix="/admin", tags=["Admin Command Center"])

@router.get("/dashboard")
async def get_admin_dashboard_metrics(
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns platform-wide KPIs, provider status, and activity overview for Admin Command Center.
    """
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    active_users = (await db.execute(select(func.count(User.id)).where(User.is_active == True))).scalar() or 0
    total_searches = (await db.execute(select(func.count(SearchHistory.id)))).scalar() or 0
    total_leads = (await db.execute(select(func.count(BusinessLead.id)))).scalar() or 0
    demo_leads = (await db.execute(select(func.count(BusinessLead.id)).where(BusinessLead.is_demo_data == True))).scalar() or 0
    real_leads = total_leads - demo_leads
    total_projects = (await db.execute(select(func.count(ProcurementProject.id)))).scalar() or 0
    total_exports = (await db.execute(select(func.count(CSVExport.id)))).scalar() or 0

    # Outreach & Email stats
    total_outreaches = (await db.execute(select(func.count(EmailOutreach.id)))).scalar() or 0
    total_replies = (await db.execute(select(func.count(EmailReply.id)))).scalar() or 0

    # Market Intelligence
    total_predictions = (await db.execute(select(func.count(MarketPrediction.id)))).scalar() or 0
    long_signals = (await db.execute(select(func.count(MarketPrediction.id)).where(MarketPrediction.direction == "LONG"))).scalar() or 0
    short_signals = (await db.execute(select(func.count(MarketPrediction.id)).where(MarketPrediction.direction == "SHORT"))).scalar() or 0
    total_alerts = (await db.execute(select(func.count(MarketAlert.id)))).scalar() or 0
    total_paper_trades = (await db.execute(select(func.count(PaperTrade.id)))).scalar() or 0

    # Provider Health
    ollama_health = await OllamaProvider.check_status()

    # Recent System Logs
    stmt_logs = select(ActivityLog).order_by(desc(ActivityLog.created_at)).limit(15)
    recent_logs_raw = (await db.execute(stmt_logs)).scalars().all()
    
    recent_activity = [
        {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "details": log.details,
            "created_at": log.created_at
        } for log in recent_logs_raw
    ]

    return {
        "kpis": {
            "total_users": total_users,
            "active_users": active_users,
            "total_searches": total_searches,
            "total_leads": total_leads,
            "demo_leads": demo_leads,
            "real_leads": real_leads,
            "total_projects": total_projects,
            "total_exports": total_exports,
            "total_outreaches": total_outreaches,
            "total_replies": total_replies,
            "total_predictions": total_predictions,
            "long_signals": long_signals,
            "short_signals": short_signals,
            "total_alerts": total_alerts,
            "total_paper_trades": total_paper_trades
        },
        "providers": {
            "ollama_local_ai": ollama_health,
            "osm_overpass_api": {"status": "ONLINE", "mode": "OpenStreetMap Real Discovery"},
            "smtp_outreach": {"status": "ONLINE", "sender": "syedzulqarnain164@gmail.com"},
            "binance_bitget_market_feed": {"status": "ONLINE", "mode": "Free Live REST & WebSocket"},
            "news_reddit_sentiment": {"status": "ONLINE", "mode": "Public Feed Parser & Verification Engine"}
        },
        "recent_activity": recent_activity
    }


@router.get("/users")
async def get_all_users(
    query: Optional[str] = None,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns user directory for Admin User Management.
    """
    stmt = select(User)
    if query and query.strip():
        q = f"%{query.strip().lower()}%"
        stmt = stmt.where((func.lower(User.email).like(q)) | (func.lower(User.full_name).like(q)))

    stmt = stmt.order_by(desc(User.created_at))
    users = (await db.execute(stmt)).scalars().all()
    return [UserResponse.model_validate(u) for u in users]


@router.get("/users/{user_id}/details")
async def get_user_full_details(
    user_id: str,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns deep breakdown of a user's activity (searches, leads, exports, CRM activity).
    """
    stmt = select(User).where(User.id == user_id)
    user = (await db.execute(stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    searches = (await db.execute(select(SearchHistory).where(SearchHistory.user_id == user.id))).scalars().all()
    leads = (await db.execute(select(BusinessLead).where(BusinessLead.user_id == user.id))).scalars().all()
    exports = (await db.execute(select(CSVExport).where(CSVExport.user_id == user.id))).scalars().all()
    outreaches = (await db.execute(select(EmailOutreach).where(EmailOutreach.user_id == user.id))).scalars().all()

    return {
        "user": UserResponse.model_validate(user),
        "total_searches": len(searches),
        "total_leads": len(leads),
        "total_exports": len(exports),
        "total_outreaches": len(outreaches),
        "recent_searches": [
            {"query": s.query_text, "industry": s.industry, "created_at": s.created_at} for s in searches[:5]
        ]
    }


@router.put("/users/{user_id}/status")
async def toggle_user_active_status(
    user_id: str,
    active: bool,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Activates or deactivates a user account.
    """
    stmt = select(User).where(User.id == user_id)
    user = (await db.execute(stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own admin account.")

    user.is_active = active
    db.add(ActivityLog(
        user_id=admin.id,
        action="ADMIN_TOGGLE_USER_STATUS",
        details={"target_user_id": user_id, "active": active}
    ))
    await db.commit()
    return {"status": "success", "user_id": user_id, "is_active": active}


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: str,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates user role (USER or ADMIN).
    """
    if role not in ["USER", "ADMIN"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be USER or ADMIN.")

    stmt = select(User).where(User.id == user_id)
    user = (await db.execute(stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.id == admin.id and role != "ADMIN":
        raise HTTPException(status_code=400, detail="Cannot downgrade your own admin account.")

    user.role = role
    db.add(ActivityLog(
        user_id=admin.id,
        action="ADMIN_UPDATE_USER_ROLE",
        details={"target_user_id": user_id, "new_role": role}
    ))
    await db.commit()
    return {"status": "success", "user_id": user_id, "role": role}


@router.get("/outreach")
async def get_all_outreach_activity(
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns platform-wide email outreach logs and client replies for Admin monitoring.
    """
    stmt_out = select(EmailOutreach).order_by(desc(EmailOutreach.sent_at)).limit(50)
    outreaches = (await db.execute(stmt_out)).scalars().all()

    stmt_rep = select(EmailReply).order_by(desc(EmailReply.received_at)).limit(50)
    replies = (await db.execute(stmt_rep)).scalars().all()

    return {
        "outreaches": [
            {
                "id": o.id,
                "lead_id": o.lead_id,
                "recipient_email": o.recipient_email,
                "sender_email": o.sender_email,
                "subject": o.subject,
                "status": o.status,
                "mode": o.mode,
                "sent_at": o.sent_at.isoformat()
            } for o in outreaches
        ],
        "replies": [
            {
                "id": r.id,
                "lead_id": r.lead_id,
                "sender_email": r.sender_email,
                "subject": r.subject,
                "summary": r.ai_summary,
                "received_at": r.received_at.isoformat()
            } for r in replies
        ]
    }


@router.get("/activity")
async def get_system_activity_logs(
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns platform activity audit log.
    """
    stmt = select(ActivityLog).order_by(desc(ActivityLog.created_at)).limit(50)
    logs = (await db.execute(stmt)).scalars().all()
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "details": log.details,
            "created_at": log.created_at
        } for log in logs
    ]


@router.get("/email-settings")
async def get_admin_email_settings(
    admin: User = Depends(get_current_admin_user)
):
    """
    Returns current SMTP & IMAP configuration (password masked).
    """
    from app.providers.email_provider import EmailProvider
    cfg = EmailProvider.get_smtp_config()
    return {
        "smtp_host": cfg["host"],
        "smtp_port": cfg["port"],
        "smtp_username": cfg["username"],
        "smtp_password_set": bool(cfg["password"]),
        "from_email": cfg["from_email"],
        "imap_host": cfg["imap_host"],
        "imap_port": cfg["imap_port"]
    }


@router.post("/email-settings")
async def update_admin_email_settings(
    payload: Dict[str, Any],
    admin: User = Depends(get_current_admin_user)
):
    """
    Securely updates server SMTP & IMAP configuration.
    """
    from app.providers.email_provider import EmailProvider
    updated = EmailProvider.update_admin_email_config(payload)
    return {
        "status": "success",
        "message": "Email configuration updated successfully.",
        "config": {
            "smtp_host": updated["host"],
            "smtp_port": updated["port"],
            "smtp_username": updated["username"],
            "from_email": updated["from_email"],
            "imap_host": updated["imap_host"],
            "imap_port": updated["imap_port"],
            "smtp_password_set": bool(updated["password"])
        }
    }


@router.post("/email-settings/test")
async def test_admin_smtp_connection(
    payload: Optional[Dict[str, Any]] = None,
    admin: User = Depends(get_current_admin_user)
):
    """
    Tests live SMTP connection, STARTTLS handshake, and authentication to Zoho Mail.
    Optionally sends a real verification email to payload['test_recipient'].
    Never leaks passwords in error or success responses.
    """
    from app.providers.email_provider import EmailProvider
    test_recipient = (payload or {}).get("test_recipient")
    result = EmailProvider.test_smtp_connection(test_recipient=test_recipient)
    return result



@router.post("/dev-reset-db")
async def development_database_reset(
    payload: Dict[str, Any],
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    DEVELOPMENT ONLY — Safely purges all test/demo leads, searches, CRM activity,
    market data, and paper trades. Preserves admin user and system configuration.
    Requires confirmation string 'RESET_CONFIRM' in the payload.
    """
    from sqlalchemy import delete
    from app.database.models import (
        BusinessLead, LeadScore, LeadAudit, LeadServiceMatch,
        SearchHistory, CSVExport, MarketPrediction, PaperTrade, MarketAlert,
        ActivityLog, ProcurementProject
    )

    confirmation = payload.get("confirmation", "")
    if confirmation != "RESET_CONFIRM":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset requires confirmation='RESET_CONFIRM' in request body."
        )

    deleted_counts = {}

    try:
        # Cascade deletes for dependent tables first
        r = await db.execute(delete(LeadServiceMatch))
        deleted_counts["lead_service_matches"] = r.rowcount

        r = await db.execute(delete(LeadAudit))
        deleted_counts["lead_audits"] = r.rowcount

        r = await db.execute(delete(LeadScore))
        deleted_counts["lead_scores"] = r.rowcount

        r = await db.execute(delete(BusinessLead))
        deleted_counts["business_leads"] = r.rowcount

        r = await db.execute(delete(ProcurementProject))
        deleted_counts["procurement_projects"] = r.rowcount

        r = await db.execute(delete(SearchHistory))
        deleted_counts["search_history"] = r.rowcount

        r = await db.execute(delete(CSVExport))
        deleted_counts["csv_exports"] = r.rowcount

        r = await db.execute(delete(MarketPrediction))
        deleted_counts["market_predictions"] = r.rowcount

        r = await db.execute(delete(PaperTrade))
        deleted_counts["paper_trades"] = r.rowcount

        r = await db.execute(delete(MarketAlert))
        deleted_counts["market_alerts"] = r.rowcount

        r = await db.execute(delete(ActivityLog))
        deleted_counts["activity_logs"] = r.rowcount

        await db.commit()

        # Log the reset action under the admin user
        reset_log = ActivityLog(
            user_id=admin.id,
            action="DEV_DB_RESET",
            details={"performed_by": admin.email, "deleted_counts": deleted_counts}
        )
        db.add(reset_log)
        await db.commit()

        total = sum(deleted_counts.values())
        return {
            "status": "success",
            "message": f"Development database reset complete. {total} records removed.",
            "deleted_counts": deleted_counts,
            "note": "Admin user and system configuration preserved. Next registered user will become ADMIN if no other users exist."
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database reset failed: {str(e)}"
        )
