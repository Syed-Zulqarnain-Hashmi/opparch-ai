import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.database.models import User, ActivityLog
from app.schemas.schemas import UserRegisterRequest, UserLoginRequest, UserResponse, TokenResponse, ProfileUpdateRequest
from app.core.security import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
async def register(
    request: UserRegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Registers a new user account (defaults to USER role, or ADMIN if first user).
    """
    email_clean = request.email.strip().lower()

    # Check if user already exists
    stmt = select(User).where(User.email == email_clean)
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Check total user count to make first registered user automatic ADMIN
    stmt_count = select(User)
    all_users = (await db.execute(stmt_count)).scalars().all()
    user_role = "ADMIN" if len(all_users) == 0 else "USER"

    hashed_pw = get_password_hash(request.password)
    user = User(
        email=email_clean,
        hashed_password=hashed_pw,
        full_name=request.full_name.strip(),
        role=user_role,
        is_active=True
    )
    db.add(user)
    await db.flush()

    # Log activity
    activity = ActivityLog(
        user_id=user.id,
        action="USER_REGISTER",
        details={"email": user.email, "role": user.role}
    )
    db.add(activity)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(data={"sub": user.id, "role": user.role})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    request: UserLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticates user credentials and returns JWT Bearer Token.
    Supports both email address (e.g. admin@opparch.ai) and username (e.g. admin).
    """
    email_clean = request.email.strip().lower()

    if email_clean == "admin":
        stmt = select(User).where((User.email == "admin@opparch.ai") | (User.email == "admin"))
    else:
        stmt = select(User).where(User.email == email_clean)

    user = (await db.execute(stmt)).scalar_one_or_none()

    # Auto-seed initial development admin on first login attempt if missing
    if not user and (email_clean in ["admin", "admin@opparch.ai"]) and request.password == "123@123":
        user = User(
            email="admin@opparch.ai",
            hashed_password=get_password_hash("123@123"),
            full_name="Platform Administrator",
            role="ADMIN",
            is_active=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/username or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact an administrator."
        )

    user.last_login_at = datetime.datetime.now(datetime.timezone.utc)
    
    activity = ActivityLog(
        user_id=user.id,
        action="USER_LOGIN",
        details={"email": user.email}
    )
    db.add(activity)
    await db.commit()

    token = create_access_token(data={"sub": user.id, "role": user.role})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """
    Returns current authenticated user details.
    """
    return UserResponse.model_validate(current_user)


@router.put("/profile", response_model=UserResponse)
async def update_my_profile(
    request: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates authenticated user's profile details.
    """
    if request.full_name and request.full_name.strip():
        current_user.full_name = request.full_name.strip()
    if request.password and len(request.password) >= 6:
        current_user.hashed_password = get_password_hash(request.password)

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)
