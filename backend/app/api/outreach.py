import asyncio
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from app.database.session import get_db
from app.database.models import BusinessLead, EmailOutreach, EmailReply, LeadNote, User, ActivityLog
from app.providers.email_provider import EmailProvider
from app.core.security import get_current_user_optional, get_current_user

router = APIRouter(prefix="/outreach", tags=["AI Email Outreach & Deal Intelligence"])

class OutreachGenerateRequest(BaseModel):
    lead_id: str
    channel: Optional[str] = "Email"
    tone: Optional[str] = "Consultative & Value-Focused"

class EmailSendRequest(BaseModel):
    lead_id: str
    recipient_email: str
    subject: str
    body: str
    mode: Optional[str] = "MANUAL"

class NoteCreateRequest(BaseModel):
    note_text: str

class SimulateReplyRequest(BaseModel):
    reply_body: str
    sender_email: Optional[str] = None

class GenerateReplyResponseRequest(BaseModel):
    lead_id: str
    reply_body: str

class CheckEligibilityRequest(BaseModel):
    lead_ids: List[str]

class BulkPreviewRequest(BaseModel):
    lead_ids: List[str]

class BulkSendItem(BaseModel):
    lead_id: str
    recipient_email: str
    subject: str
    body: str
    approved: bool = True

class BulkSendRequest(BaseModel):
    emails: List[BulkSendItem]
    delay_seconds: Optional[int] = None

class QuickSendRequest(BaseModel):
    lead_ids: List[str]
    delay_seconds: Optional[int] = None



@router.post("/check-eligibility", response_model=dict)
async def check_outreach_eligibility(
    payload: CheckEligibilityRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Evaluates selected leads for outreach eligibility:
    - Valid non-empty email syntax
    - Not already contacted (pipeline_stage not CONTACTED, REPLIED, WON, LOST)
    - Deduplicates email addresses within the batch
    - Sufficient business intelligence profile
    Returns categorized counts and itemized status per lead.
    """
    if not payload.lead_ids:
        return {
            "total_selected": 0,
            "valid_emails": 0,
            "ready_for_outreach": 0,
            "already_contacted": 0,
            "invalid": 0,
            "duplicates": 0,
            "leads": []
        }

    stmt = (
        select(BusinessLead)
        .where(BusinessLead.id.in_(payload.lead_ids))
        .options(
            selectinload(BusinessLead.score),
            selectinload(BusinessLead.audit),
            selectinload(BusinessLead.services)
        )
    )
    leads = (await db.execute(stmt)).scalars().all()
    lead_dict = {l.id: l for l in leads}

    results = []
    seen_emails = set()
    total_selected = len(payload.lead_ids)
    valid_emails_count = 0
    ready_count = 0
    already_contacted_count = 0
    invalid_count = 0
    duplicates_count = 0

    for lid in payload.lead_ids:
        lead = lead_dict.get(lid)
        if not lead:
            results.append({
                "lead_id": lid,
                "business_name": "Unknown",
                "email": None,
                "is_eligible": False,
                "reason": "Lead not found in database"
            })
            invalid_count += 1
            continue

        raw_email = (lead.email or "").strip()
        is_valid_format = EmailProvider.validate_email_syntax(raw_email)
        is_already_contacted = lead.pipeline_stage in ["CONTACTED", "REPLIED", "MEETING", "PROPOSAL", "WON", "LOST"]

        if not raw_email or not is_valid_format:
            results.append({
                "lead_id": lead.id,
                "business_name": lead.name,
                "email": raw_email or None,
                "industry": lead.industry,
                "country": lead.country,
                "city": lead.city,
                "has_website": lead.has_website,
                "is_eligible": False,
                "reason": "No valid public email address detected"
            })
            invalid_count += 1
            continue

        valid_emails_count += 1

        if raw_email.lower() in seen_emails:
            results.append({
                "lead_id": lead.id,
                "business_name": lead.name,
                "email": raw_email,
                "industry": lead.industry,
                "country": lead.country,
                "city": lead.city,
                "has_website": lead.has_website,
                "is_eligible": False,
                "reason": "Duplicate email address in current batch"
            })
            duplicates_count += 1
            continue

        seen_emails.add(raw_email.lower())

        if is_already_contacted:
            results.append({
                "lead_id": lead.id,
                "business_name": lead.name,
                "email": raw_email,
                "industry": lead.industry,
                "country": lead.country,
                "city": lead.city,
                "has_website": lead.has_website,
                "pipeline_stage": lead.pipeline_stage,
                "is_eligible": False,
                "reason": f"Already in active pipeline ({lead.pipeline_stage})"
            })
            already_contacted_count += 1
            continue

        # Lead is ready and eligible
        rec_service = lead.services[0].service_name if lead.services else "Full-Stack Web Development"
        opp_reason = lead.score.reasoning_summary if lead.score else ("No active website found" if not lead.has_website else "Digital presence transformation")

        results.append({
            "lead_id": lead.id,
            "business_name": lead.name,
            "email": raw_email,
            "industry": lead.industry,
            "country": lead.country,
            "city": lead.city,
            "has_website": lead.has_website,
            "pipeline_stage": lead.pipeline_stage,
            "recommended_service": rec_service,
            "opportunity_reason": opp_reason,
            "opportunity_score": lead.score.opportunity_score if lead.score else 85,
            "is_eligible": True,
            "reason": "Eligible for AI personalized outreach"
        })
        ready_count += 1

    return {
        "total_selected": total_selected,
        "valid_emails": valid_emails_count,
        "ready_for_outreach": ready_count,
        "already_contacted": already_contacted_count,
        "invalid": invalid_count,
        "duplicates": duplicates_count,
        "leads": results
    }


@router.post("/bulk-preview", response_model=dict)
async def generate_bulk_preview(
    payload: BulkPreviewRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Generates personalized email previews for all approved/eligible leads in the batch.
    Uses grounded AI analysis tailored across Cases A-E.
    """
    if not payload.lead_ids:
        return {"previews": []}

    stmt = (
        select(BusinessLead)
        .where(BusinessLead.id.in_(payload.lead_ids))
        .options(
            selectinload(BusinessLead.score),
            selectinload(BusinessLead.audit),
            selectinload(BusinessLead.services)
        )
    )
    leads = (await db.execute(stmt)).scalars().all()
    from_addr = EmailProvider.get_smtp_config()["from_email"]

    previews = []
    for lead in leads:
        evidence = lead.audit.evidence_points if lead.audit else []
        services = [sm.service_name for sm in (lead.services or [])] or ["Full-Stack Web Development & SEO"]
        reason = lead.score.reasoning_summary if lead.score else ("No active website found" if not lead.has_website else "Digital growth opportunity")

        draft = await EmailProvider.generate_outreach_email(
            business_name=lead.name,
            industry=lead.industry,
            country=lead.country,
            city=lead.city,
            website_url=lead.website_url,
            has_website=lead.has_website,
            evidence_points=evidence,
            recommended_services=services,
            opportunity_reason=reason
        )

        previews.append({
            "lead_id": lead.id,
            "business_name": lead.name,
            "recipient_email": (lead.email or "").strip(),
            "has_recipient_email": bool(lead.email and EmailProvider.validate_email_syntax(lead.email)),
            "industry": lead.industry,
            "country": lead.country,
            "city": lead.city,
            "recommended_service": services[0] if services else "Full-Stack Web Development",
            "opportunity_reason": reason,
            "subject": draft["subject"],
            "body": draft["body"],
            "sender_email": from_addr,
            "approved": True
        })

    return {
        "count": len(previews),
        "sender_email": from_addr,
        "previews": previews
    }


@router.post("/bulk-send", response_model=dict)
async def send_bulk_outreach(
    payload: BulkSendRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Executes controlled batch email outreach via Zoho SMTP (mail.zoho.com:587 STARTTLS)
    with safe inter-message delay and per-lead resilience.
    Records individual EmailOutreach history and advances successfully sent leads to CONTACTED.
    """
    from_addr = EmailProvider.get_smtp_config()["from_email"]
    delay_sec = payload.delay_seconds if payload.delay_seconds is not None else EmailProvider.get_smtp_config()["delay_seconds"]

    approved_items = [e for e in payload.emails if e.approved]
    total = len(payload.emails)
    sent_count = 0
    failed_count = 0
    skipped_count = len(payload.emails) - len(approved_items)
    results = []

    for idx, item in enumerate(approved_items):
        if not EmailProvider.validate_email_syntax(item.recipient_email):
            results.append({
                "lead_id": item.lead_id,
                "recipient_email": item.recipient_email,
                "status": "INVALID_RECIPIENT",
                "message": "Invalid or missing recipient email."
            })
            failed_count += 1
            continue

        stmt = select(BusinessLead).where(BusinessLead.id == item.lead_id)
        lead = (await db.execute(stmt)).scalar_one_or_none()
        if not lead:
            results.append({
                "lead_id": item.lead_id,
                "recipient_email": item.recipient_email,
                "status": "NOT_FOUND",
                "message": "Lead record not found."
            })
            failed_count += 1
            continue

        # Send via Zoho SMTP
        send_res = EmailProvider.send_email(
            recipient_email=item.recipient_email,
            subject=item.subject,
            body=item.body
        )

        is_success = send_res.get("success", False)
        outreach_status = "SENT" if is_success else "FAILED"

        # Record outreach activity
        outreach = EmailOutreach(
            lead_id=lead.id,
            user_id=current_user.id if current_user else None,
            recipient_email=item.recipient_email,
            sender_email=from_addr,
            subject=item.subject,
            body=item.body,
            status=outreach_status,
            error_message=send_res.get("message") if not is_success else None,
            mode="BULK"
        )
        db.add(outreach)

        # Advance CRM stage if send succeeded
        if is_success:
            if lead.pipeline_stage in ["NEW", "RESEARCHING", "READY_FOR_OUTREACH"]:
                lead.pipeline_stage = "CONTACTED"
                lead.follow_up_date = (datetime.datetime.utcnow() + datetime.timedelta(days=3)).strftime("%Y-%m-%d")
            sent_count += 1
        else:
            failed_count += 1

        results.append({
            "lead_id": lead.id,
            "business_name": lead.name,
            "recipient_email": item.recipient_email,
            "status": send_res.get("status", outreach_status),
            "message": send_res.get("message", "")
        })

        # Commit per send so logs are persisted immediately
        await db.commit()

        # Apply rate limiting delay between consecutive emails
        if idx < len(approved_items) - 1 and delay_sec > 0:
            await asyncio.sleep(delay_sec)

    # Log overall activity
    if current_user:
        db.add(ActivityLog(
            user_id=current_user.id,
            action="BULK_OUTREACH_EXECUTED",
            details={
                "total": total,
                "sent": sent_count,
                "failed": failed_count,
                "skipped": skipped_count
            }
        ))
        await db.commit()

    return {
        "status": "success",
        "total": total,
        "sent": sent_count,
        "failed": failed_count,
        "skipped": skipped_count,
        "results": results
    }


@router.post("/quick-send", response_model=dict)
async def quick_ai_outreach(
    payload: QuickSendRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):

    """
    One-Click Automated AI Outreach Workflow:
    For every selected lead:
      1. Check email existence & valid format (SKIPPED if missing or invalid)
      2. Check duplicate / already contacted status (SKIPPED if already contacted)
      3. Analyze opportunity & generate grounded personalized email
      4. Send through Zoho SMTP (mail.zoho.com:587 STARTTLS) with rate-limiting delay
      5. Save individual EmailOutreach record in database
      6. Advance lead pipeline stage to CONTACTED if send was successful
    """
    if not payload.lead_ids:
        return {"status": "error", "message": "No lead IDs provided", "total": 0, "sent": 0, "failed": 0, "skipped": 0, "results": []}

    from_addr = EmailProvider.get_smtp_config()["from_email"]
    delay_sec = payload.delay_seconds if payload.delay_seconds is not None else EmailProvider.get_smtp_config()["delay_seconds"]

    stmt = (
        select(BusinessLead)
        .where(BusinessLead.id.in_(payload.lead_ids))
        .options(
            selectinload(BusinessLead.score),
            selectinload(BusinessLead.audit),
            selectinload(BusinessLead.services)
        )
    )
    leads = (await db.execute(stmt)).scalars().all()
    lead_dict = {l.id: l for l in leads}

    total = len(payload.lead_ids)
    sent_count = 0
    failed_count = 0
    skipped_count = 0
    results = []
    seen_emails = set()

    for idx, lid in enumerate(payload.lead_ids):
        lead = lead_dict.get(lid)
        if not lead:
            results.append({
                "lead_id": lid,
                "business_name": "Unknown",
                "recipient_email": None,
                "status": "SKIPPED",
                "message": "Lead not found in database"
            })
            skipped_count += 1
            continue

        raw_email = (lead.email or "").strip()
        if not raw_email or not EmailProvider.validate_email_syntax(raw_email):
            results.append({
                "lead_id": lead.id,
                "business_name": lead.name,
                "recipient_email": raw_email or None,
                "status": "SKIPPED",
                "message": "No valid public email address"
            })
            skipped_count += 1
            continue

        if raw_email.lower() in seen_emails:
            results.append({
                "lead_id": lead.id,
                "business_name": lead.name,
                "recipient_email": raw_email,
                "status": "SKIPPED",
                "message": "Duplicate email in batch"
            })
            skipped_count += 1
            continue

        seen_emails.add(raw_email.lower())

        if lead.pipeline_stage in ["CONTACTED", "REPLIED", "MEETING", "PROPOSAL", "WON", "LOST"]:
            results.append({
                "lead_id": lead.id,
                "business_name": lead.name,
                "recipient_email": raw_email,
                "status": "SKIPPED",
                "message": f"Already contacted ({lead.pipeline_stage})"
            })
            skipped_count += 1
            continue

        # Generate individual grounded personalized outreach email
        evidence = lead.audit.evidence_points if lead.audit else []
        services = [sm.service_name for sm in (lead.services or [])] or ["Full-Stack Web Development"]
        reason = lead.score.reasoning_summary if lead.score else ("No active website found" if not lead.has_website else "Digital presence transformation")

        draft = await EmailProvider.generate_outreach_email(
            business_name=lead.name,
            industry=lead.industry,
            country=lead.country,
            city=lead.city,
            website_url=lead.website_url,
            has_website=lead.has_website,
            contact_person=getattr(lead, "contact_person", None),
            evidence_points=evidence,
            recommended_services=services,
            opportunity_reason=reason
        )

        # Dispatch via Zoho SMTP
        send_res = EmailProvider.send_email(
            recipient_email=raw_email,
            subject=draft["subject"],
            body=draft["body"]
        )

        is_success = send_res.get("success", False)
        outreach_status = "SENT" if is_success else "FAILED"

        # Record outreach in CRM database
        outreach = EmailOutreach(
            lead_id=lead.id,
            user_id=current_user.id if current_user else None,
            recipient_email=raw_email,
            sender_email=from_addr,
            subject=draft["subject"],
            body=draft["body"],
            status=outreach_status,
            error_message=send_res.get("message") if not is_success else None,
            mode="QUICK_ONE_CLICK"
        )
        db.add(outreach)

        if is_success:
            lead.pipeline_stage = "CONTACTED"
            lead.follow_up_date = (datetime.datetime.utcnow() + datetime.timedelta(days=3)).strftime("%Y-%m-%d")
            sent_count += 1
        else:
            failed_count += 1

        results.append({
            "lead_id": lead.id,
            "business_name": lead.name,
            "recipient_email": raw_email,
            "subject": draft["subject"],
            "status": send_res.get("status", outreach_status),
            "message": send_res.get("message", "Sent successfully")
        })

        await db.commit()

        # Inter-message delay
        if idx < len(payload.lead_ids) - 1 and delay_sec > 0:
            await asyncio.sleep(delay_sec)

    if current_user:
        db.add(ActivityLog(
            user_id=current_user.id,
            action="QUICK_AI_OUTREACH_EXECUTED",
            details={
                "total": total,
                "sent": sent_count,
                "failed": failed_count,
                "skipped": skipped_count
            }
        ))
        await db.commit()

    return {
        "status": "success",
        "total": total,
        "sent": sent_count,
        "failed": failed_count,
        "skipped": skipped_count,
        "results": results
    }


@router.post("/generate", response_model=dict)
async def generate_email(
    request: OutreachGenerateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Generates a personalized, consultative outreach email for a specific lead based on real audit evidence.
    """
    stmt = (
        select(BusinessLead)
        .where(BusinessLead.id == request.lead_id)
        .options(
            selectinload(BusinessLead.score),
            selectinload(BusinessLead.audit),
            selectinload(BusinessLead.services)
        )
    )
    lead = (await db.execute(stmt)).scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    evidence = lead.audit.evidence_points if lead.audit else ["Opportunity for digital presence transformation."]
    recommended_services = [sm.service_name for sm in (lead.services or [])]
    from_addr = EmailProvider.get_smtp_config()["from_email"]

    draft = await EmailProvider.generate_outreach_email(
        business_name=lead.name,
        industry=lead.industry,
        country=lead.country,
        city=lead.city,
        website_url=lead.website_url,
        has_website=lead.has_website,
        contact_person=getattr(lead, "contact_person", None),
        evidence_points=evidence,
        recommended_services=recommended_services,
        opportunity_reason=lead.score.reasoning_summary if lead.score else None
    )

    return {
        "lead_id": lead.id,
        "business_name": lead.name,
        "recipient_email": lead.email or "EMAIL NOT AVAILABLE",
        "has_recipient_email": bool(lead.email and EmailProvider.validate_email_syntax(lead.email)),
        "subject": draft["subject"],
        "body": draft["body"],
        "sender_email": from_addr
    }



@router.post("/send", response_model=dict)
async def send_outreach_email(
    payload: EmailSendRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Sends cold outreach email via Zoho SMTP, records outreach log, and advances lead to CONTACTED.
    """
    stmt = select(BusinessLead).where(BusinessLead.id == payload.lead_id)
    lead = (await db.execute(stmt)).scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    from_addr = EmailProvider.get_smtp_config()["from_email"]

    # Perform SMTP send
    send_result = EmailProvider.send_email(
        recipient_email=payload.recipient_email,
        subject=payload.subject,
        body=payload.body
    )

    is_success = send_result.get("success", False)
    outreach_status = "SENT" if is_success else "FAILED"

    # Save to database
    outreach = EmailOutreach(
        lead_id=lead.id,
        user_id=current_user.id if current_user else None,
        recipient_email=payload.recipient_email,
        sender_email=from_addr,
        subject=payload.subject,
        body=payload.body,
        status=outreach_status,
        error_message=send_result.get("message") if not is_success else None,
        mode=payload.mode or "MANUAL"
    )
    db.add(outreach)

    # Update Lead status to CONTACTED if currently NEW, RESEARCHING, or READY_FOR_OUTREACH
    if is_success and lead.pipeline_stage in ["NEW", "RESEARCHING", "READY_FOR_OUTREACH"]:
        lead.pipeline_stage = "CONTACTED"
        lead.follow_up_date = (datetime.datetime.utcnow() + datetime.timedelta(days=3)).strftime("%Y-%m-%d")

    # Add activity log
    log = ActivityLog(
        user_id=current_user.id if current_user else None,
        action="OUTREACH_EMAIL_SENT",
        details={
            "lead_name": lead.name,
            "recipient_email": payload.recipient_email,
            "subject": payload.subject,
            "status": outreach.status
        }
    )
    db.add(log)
    await db.commit()

    return {
        "status": "success" if is_success else "failed",
        "outreach_id": outreach.id,
        "lead_status": lead.pipeline_stage,
        "message": send_result["message"],
        "sent_at": outreach.sent_at.isoformat()
    }


@router.get("/thread/{lead_id}", response_model=dict)
async def get_lead_thread(
    lead_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves the complete communication thread (Emails Sent, Client Replies, User Notes) for a lead.
    """
    stmt = (
        select(BusinessLead)
        .where(BusinessLead.id == lead_id)
        .options(
            selectinload(BusinessLead.outreach_emails),
            selectinload(BusinessLead.replies),
            selectinload(BusinessLead.notes)
        )
    )
    lead = (await db.execute(stmt)).scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    outreaches = [
        {
            "id": o.id,
            "type": "OUTREACH",
            "sender": o.sender_email,
            "recipient": o.recipient_email,
            "subject": o.subject,
            "body": o.body,
            "status": o.status,
            "mode": o.mode,
            "timestamp": o.sent_at.isoformat()
        } for o in (lead.outreach_emails or [])
    ]

    replies = [
        {
            "id": r.id,
            "type": "REPLY",
            "sender": r.sender_email,
            "subject": r.subject,
            "body": r.body,
            "extracted_requirements": r.extracted_requirements or [],
            "extracted_budget": r.extracted_budget,
            "extracted_timeline": r.extracted_timeline,
            "extracted_questions": r.extracted_questions or [],
            "ai_summary": r.ai_summary,
            "suggested_response": r.suggested_response,
            "timestamp": r.received_at.isoformat()
        } for r in (lead.replies or [])
    ]

    notes = [
        {
            "id": n.id,
            "type": "NOTE",
            "author": n.author_name,
            "note_text": n.note_text,
            "timestamp": n.created_at.isoformat()
        } for n in (lead.notes or [])
    ]

    # Combine chronologically
    timeline = sorted(outreaches + replies + notes, key=lambda x: x["timestamp"])

    return {
        "lead_id": lead.id,
        "business_name": lead.name,
        "pipeline_stage": lead.pipeline_stage,
        "timeline": timeline,
        "total_outreaches": len(outreaches),
        "total_replies": len(replies),
        "total_notes": len(notes)
    }

@router.post("/note/{lead_id}", response_model=dict)
async def add_lead_note(
    lead_id: str,
    payload: NoteCreateRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Appends a manual note to the lead CRM thread.
    """
    stmt = select(BusinessLead).where(BusinessLead.id == lead_id)
    lead = (await db.execute(stmt)).scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    author = current_user.full_name if current_user else "Syed Zulqarnain"
    note = LeadNote(
        lead_id=lead.id,
        user_id=current_user.id if current_user else None,
        author_name=author,
        note_text=payload.note_text.strip()
    )
    db.add(note)
    await db.commit()

    return {
        "status": "success",
        "note_id": note.id,
        "message": "Note added successfully.",
        "created_at": note.created_at.isoformat()
    }

@router.post("/simulate-reply/{lead_id}", response_model=dict)
async def register_client_reply(
    lead_id: str,
    payload: SimulateReplyRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Registers an incoming email reply from a client, extracts requirements via Ollama, updates CRM stage to REPLIED.
    """
    stmt = select(BusinessLead).where(BusinessLead.id == lead_id)
    lead = (await db.execute(stmt)).scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    analysis = await EmailProvider.analyze_client_reply(
        business_name=lead.name,
        reply_body=payload.reply_body
    )

    reply = EmailReply(
        lead_id=lead.id,
        sender_email=payload.sender_email or lead.email or "client@business.com",
        subject=f"Re: Digital Opportunity & Growth Architecture for {lead.name}",
        body=payload.reply_body,
        extracted_requirements=analysis.get("requirements", []),
        extracted_budget=analysis.get("budget"),
        extracted_timeline=analysis.get("timeline"),
        extracted_questions=analysis.get("questions", []),
        ai_summary=analysis.get("summary"),
        suggested_response=analysis.get("recommended_response")
    )
    db.add(reply)

    # Move CRM to REPLIED
    lead.pipeline_stage = "REPLIED"
    await db.commit()

    return {
        "status": "success",
        "reply_id": reply.id,
        "pipeline_stage": lead.pipeline_stage,
        "ai_analysis": analysis,
        "message": "Client reply registered and analyzed. Deal moved to REPLIED."
    }

@router.post("/generate-reply-response", response_model=dict)
async def generate_reply_response(
    payload: GenerateReplyResponseRequest
):
    """
    AI Follow-Up Assistant: Drafts a tailored response to an incoming client reply without auto-sending.
    """
    analysis = await EmailProvider.analyze_client_reply(
        business_name="Client",
        reply_body=payload.reply_body
    )
    return {
        "status": "success",
        "recommended_response": analysis.get("suggested_response"),
        "analysis": analysis
    }


@router.post("/check-inbound", response_model=dict)
async def check_real_inbound_emails(
    db: AsyncSession = Depends(get_db)
):
    """
    Polls configured IMAP inbox (Gmail), matches inbound messages with existing leads by sender email,
    advances lead to REPLIED stage, runs Ollama AI reply analysis, and saves to CRM thread.
    """
    raw_emails = await EmailProvider.check_inbound_replies()
    matched_count = 0

    for msg in raw_emails:
        sender = msg.get("from", "")
        # Extract email address from sender header
        email_addr = sender.split("<")[-1].replace(">", "").strip() if "<" in sender else sender.strip()
        
        stmt = select(BusinessLead).where(BusinessLead.email == email_addr)
        lead = (await db.execute(stmt)).scalars().first()
        if lead:
            analysis = await EmailProvider.analyze_client_reply(
                business_name=lead.name,
                reply_body=msg.get("body", "")
            )
            reply = EmailReply(
                lead_id=lead.id,
                sender_email=email_addr,
                subject=msg.get("subject", f"Re: Opportunity for {lead.name}"),
                body=msg.get("body", ""),
                extracted_requirements=analysis.get("requirements", []),
                extracted_budget=analysis.get("budget"),
                extracted_timeline=analysis.get("timeline"),
                extracted_questions=analysis.get("questions", []),
                ai_summary=analysis.get("summary"),
                suggested_response=analysis.get("recommended_response")
            )
            db.add(reply)
            lead.pipeline_stage = "REPLIED"
            matched_count += 1

    if matched_count > 0:
        await db.commit()

    return {
        "status": "success",
        "inbox_emails_checked": len(raw_emails),
        "matched_lead_replies": matched_count,
        "message": f"Checked IMAP inbox. {matched_count} new replies matched with CRM leads."
    }
