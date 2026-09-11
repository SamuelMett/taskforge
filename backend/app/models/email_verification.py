from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, func

from app.db.base_class import Base


class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String, nullable=False, index=True)

    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class VerifiedEmail(Base):
    """
    Presence of a row for a user_id means that user's email is verified.
    A separate table rather than a column on `users`, same reasoning as
    admin_users -- no migration needed against the existing production
    table.
    """

    __tablename__ = "verified_emails"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    verified_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
