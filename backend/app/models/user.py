from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)

    twofa_enabled = Column(Boolean, default=False)
    twofa_secret = Column(String, nullable=True)

    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
