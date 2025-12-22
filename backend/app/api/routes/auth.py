from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate, UserOut
from app.core.security import hash_password, verify_password, create_access_token

import base64
import io

import pyotp
import qrcode
from fastapi import Body

from app.api.deps.auth import get_current_user, get_db


router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
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


from fastapi import Body

@router.post("/login")
def login(
    payload: UserCreate,
    db: Session = Depends(get_db),
    otp: str | None = Body(default=None),
):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # If 2FA is enabled, require OTP
    if user.twofa_enabled:
        # If user didn't send otp, tell frontend "ask for OTP"
        if not otp:
            return {
                "requires_2fa": True,
                "message": "2FA code required",
            }

        if not user.twofa_secret:
            raise HTTPException(status_code=400, detail="2FA secret missing")

        totp = pyotp.TOTP(user.twofa_secret)
        if not totp.verify(otp):
            raise HTTPException(status_code=401, detail="Invalid 2FA code")

    token = create_access_token(subject=user.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "twofa_enabled": user.twofa_enabled,
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
def twofa_confirm(
    code: str,
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
