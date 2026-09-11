from datetime import datetime, timezone
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict, field_validator

Priority = Literal["low", "med", "high"]


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_at: Optional[datetime] = None
    priority: Priority = "med"


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_at: Optional[datetime] = None
    is_done: Optional[bool] = None
    priority: Optional[Priority] = None


class TaskOut(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    is_done: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    @field_validator("due_at", "created_at", "updated_at", mode="before")
    @classmethod
    def _assume_utc(cls, v):
        # SQLite drops tzinfo on read, so a naive datetime coming back from
        # the DB is actually UTC — tag it as such so it serializes with an
        # offset and browsers don't misinterpret it as local time.
        if isinstance(v, datetime) and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v
