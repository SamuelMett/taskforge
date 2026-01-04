from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

# Password hashing context (bcrypt is the standard)
pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    """Turn a plain password into a secure hash to store in the DB."""
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Check a plain password against the stored hash."""
    return pwd_context.verify(password, password_hash)


def create_access_token(subject: str, expires_minutes: int | None = None) -> str:
    """
    Create a JWT token.
    - subject is usually the user identifier (we'll use email for now)
    - exp is the expiry time
    """
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": subject, "exp": expire}

    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
