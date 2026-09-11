from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_admin, get_current_user, get_db
from app.models.admin import AdminUser
from app.models.task import Task
from app.models.user import User

router = APIRouter()


@router.get("/me")
def admin_me(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    is_admin = db.query(AdminUser).filter(AdminUser.user_id == user.id).first() is not None
    admin_exists = db.query(AdminUser).first() is not None
    return {"is_admin": is_admin, "admin_exists": admin_exists}


@router.post("/bootstrap", status_code=status.HTTP_201_CREATED)
def bootstrap_admin(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    One-time self-promotion: the first authenticated user to call this
    becomes an admin. Once any admin exists, this permanently closes.
    """
    if db.query(AdminUser).first() is not None:
        raise HTTPException(status_code=400, detail="An admin has already been set")

    db.add(AdminUser(user_id=user.id))
    db.commit()

    return {"message": "You are now an admin", "is_admin": True}


@router.get("/stats")
def admin_stats(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    total_users = db.query(func.count(User.id)).scalar()
    users_with_2fa = db.query(func.count(User.id)).filter(User.twofa_enabled.is_(True)).scalar()
    total_tasks = db.query(func.count(Task.id)).scalar()
    completed_tasks = db.query(func.count(Task.id)).filter(Task.is_done.is_(True)).scalar()

    return {
        "total_users": total_users,
        "users_with_2fa": users_with_2fa,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
    }


@router.get("/users")
def admin_users(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            User.id,
            User.email,
            User.twofa_enabled,
            func.count(Task.id).label("task_count"),
        )
        .outerjoin(Task, Task.user_id == User.id)
        .group_by(User.id)
        .order_by(User.id.asc())
        .all()
    )

    return [
        {
            "id": r.id,
            "email": r.email,
            "twofa_enabled": r.twofa_enabled,
            "task_count": r.task_count,
        }
        for r in rows
    ]
