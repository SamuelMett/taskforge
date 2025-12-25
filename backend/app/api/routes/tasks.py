from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import case

from app.api.deps.auth import get_db, get_current_user
from app.models.user import User
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut, Priority

router = APIRouter()


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = Task(
        user_id=user.id,
        title=payload.title,
        description=payload.description,
        due_at=payload.due_at,
        priority=payload.priority,  # NEW
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("", response_model=list[TaskOut])
def list_tasks(
    priority: Priority | None = Query(default=None),
    is_done: bool | None = Query(default=None),
    sort: str = Query(default="newest", pattern="^(newest|due|priority)$"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Task).filter(Task.user_id == user.id)

    if priority is not None:
        q = q.filter(Task.priority == priority)

    if is_done is not None:
        q = q.filter(Task.is_done == is_done)

    if sort == "due":
        # due soon first, nulls last
        q = q.order_by(Task.due_at.is_(None), Task.due_at.asc(), Task.created_at.desc())
    elif sort == "priority":
        # high -> med -> low
        prio_rank = case(
            (Task.priority == "high", 0),
            (Task.priority == "med", 1),
            (Task.priority == "low", 2),
            else_=1,
        )
        q = q.order_by(prio_rank.asc(), Task.created_at.desc())
    else:
        q = q.order_by(Task.created_at.desc())

    return q.all()


@router.get("/{task_id}", response_model=TaskOut)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(task, k, v)

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return None
