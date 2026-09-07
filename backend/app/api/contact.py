from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from typing import List, Optional
import datetime

from app.database.session import get_db
from app.database.models import ContactMessage, User, ActivityLog
from app.core.security import get_current_user_optional, get_current_user

router = APIRouter(prefix="/contact", tags=["Contact Messages"])

class ContactCreateRequest(BaseModel):
    name: str
    email: str
    subject: str
    message: str

class ContactMessageResponse(BaseModel):
    id: str
    name: str
    email: str
    subject: str
    message: str
    is_read: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def submit_contact_message(
    payload: ContactCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Submits a contact message from the Contact Us page and stores it in the database.
    """
    new_msg = ContactMessage(
        name=payload.name.strip(),
        email=payload.email.strip().lower(),
        subject=payload.subject.strip(),
        message=payload.message.strip()
    )
    db.add(new_msg)

    # Log activity
    log = ActivityLog(
        user_id=current_user.id if current_user else None,
        action="CONTACT_MESSAGE_SUBMITTED",
        details={
            "sender_name": payload.name,
            "sender_email": payload.email,
            "subject": payload.subject
        }
    )
    db.add(log)

    await db.commit()
    return {
        "status": "success",
        "message": "Your message has been received. Syed Zulqarnain will respond shortly.",
        "message_id": new_msg.id
    }

@router.get("", response_model=List[ContactMessageResponse])
async def list_contact_messages(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Admin endpoint to view all submitted contact inquiries.
    """
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required to view contact messages."
        )

    stmt = select(ContactMessage).order_by(desc(ContactMessage.created_at))
    results = (await db.execute(stmt)).scalars().all()
    return results

@router.put("/{message_id}/read", response_model=dict)
async def mark_message_as_read(
    message_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required."
        )

    stmt = select(ContactMessage).where(ContactMessage.id == message_id)
    msg = (await db.execute(stmt)).scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")

    msg.is_read = True
    await db.commit()
    return {"status": "success", "message": "Marked as read."}
