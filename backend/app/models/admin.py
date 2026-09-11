from sqlalchemy import Column, DateTime, ForeignKey, Integer, func

from app.db.base_class import Base


class AdminUser(Base):
    """
    Marks a user as an admin. A separate table rather than a column on
    `users` so promoting someone doesn't require altering the existing
    production table.
    """

    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
