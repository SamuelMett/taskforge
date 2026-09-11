from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.password_reset import PasswordResetToken
from app.schemas.user import UserCreate, UserOut
from app.core.security import hash_password, verify_password, create_access_token
from app.core.limiter import limiter
from app.core.config import settings
from app.core.mailer import send_email

import base64
import hashlib
import io
import logging
import secrets
from datetime import datetime, timedelta, timezone

import pyotp
import qrcode
from fastapi import Body

from app.api.deps.auth import get_current_user, get_db
from app.schemas.auth import (
    LoginRequest,
    Login2FARequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.api.deps.auth import get_current_user

logger = logging.getLogger(__name__)

RESET_TOKEN_TTL_MINUTES = 30

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/hour")
def register(request: Request, payload: UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user

@router.post("/login-2fa")
@limiter.limit("5/minute")
def login_2fa(request: Request, payload: Login2FARequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user.twofa_enabled:
        raise HTTPException(status_code=400, detail="2FA is not enabled for this account")

    if not user.twofa_secret:
        raise HTTPException(status_code=400, detail="2FA secret missing (contact support)")

    totp = pyotp.TOTP(user.twofa_secret)
    if not totp.verify(payload.otp):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid 2FA code")

    token = create_access_token(subject=user.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "twofa_enabled": True,
        "requires_2fa": False,
    }



@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    # If 2FA is enabled, do NOT issue token yet
    if user.twofa_enabled:
        return {
            "access_token": None,
            "token_type": "bearer",
            "twofa_enabled": True,
            "requires_2fa": True,
            "message": "2FA code required",
        }

    token = create_access_token(subject=user.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "twofa_enabled": False,
        "requires_2fa": False,
    }




@router.post("/2fa/setup")
def twofa_setup(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generates a TOTP secret + QR code.
    Stores secret on user but does NOT enable 2FA until confirmed.
    """
    secret = pyotp.random_base32()
    user.twofa_secret = secret
    user.twofa_enabled = False

    # ✅ Do NOT db.add(user) (user already attached to this session)
    db.commit()
    db.refresh(user)

    issuer = "TaskForge"
    otp_uri = pyotp.totp.TOTP(secret).provisioning_uri(name=user.email, issuer_name=issuer)

    # Generate QR code PNG as base64 so frontend can display it easily
    img = qrcode.make(otp_uri)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    return {
        "otp_uri": otp_uri,
        "qr_png_base64": qr_b64,
        "message": "Scan QR in authenticator app, then confirm with a 6-digit code.",
    }


@router.post("/2fa/confirm")
@limiter.limit("5/minute")
def twofa_confirm(
    request: Request,
    code: str = Body(embed=True),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Confirms 2FA by verifying the 6-digit code from the authenticator app.
    """
    if not user.twofa_secret:
        raise HTTPException(status_code=400, detail="2FA is not set up yet")

    totp = pyotp.TOTP(user.twofa_secret)
    if not totp.verify(code):
        raise HTTPException(status_code=400, detail="Invalid 2FA code")

    user.twofa_enabled = True

    # ✅ no db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "2FA enabled successfully", "twofa_enabled": True}



@router.post("/forgot-password")
@limiter.limit("5/hour")
def forgot_password(request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Always returns the same generic message, whether or not the email is
    registered, so this endpoint can't be used to enumerate accounts.
    """
    generic_response = {
        "message": "If that email is registered, a reset link has been sent."
    }

    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        return generic_response

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_TTL_MINUTES)

    reset_row = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(reset_row)
    db.commit()

    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
    body = (
        f"Someone requested a password reset for your TaskForge account.\n\n"
        f"Reset your password: {reset_link}\n\n"
        f"This link expires in {RESET_TOKEN_TTL_MINUTES} minutes. "
        f"If you didn't request this, you can safely ignore this email."
    )

    try:
        send_email(to=user.email, subject="Reset your TaskForge password", body=body)
    except Exception:
        logger.exception("Failed to send password reset email to %s", user.email)

    return generic_response


@router.post("/reset-password")
@limiter.limit("5/hour")
def reset_password(request: Request, payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(payload.token.encode()).hexdigest()

    reset_row = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token_hash == token_hash)
        .first()
    )

    now = datetime.now(timezone.utc)
    if (
        not reset_row
        or reset_row.used
        or reset_row.expires_at.replace(tzinfo=timezone.utc) < now
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    user = db.query(User).filter(User.id == reset_row.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    user.password_hash = hash_password(payload.new_password)
    reset_row.used = True

    db.commit()

    return {"message": "Password updated. You can now log in."}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
