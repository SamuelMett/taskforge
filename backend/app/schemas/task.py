from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict

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
