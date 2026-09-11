import secrets

from fastapi import APIRouter, Body, Depends, HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_admin, get_current_user, get_db
from app.core.config import settings
from app.core.limiter import limiter
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
    return {"is_admin": is_admin}


@router.post("/bootstrap", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/hour")
def bootstrap_admin(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    secret: str = Body(embed=True),
):
    """
    Promotes the calling (authenticated) user to admin, but only if they
    supply ADMIN_BOOTSTRAP_SECRET -- a value that only exists as an env
    var you set yourself, never in the UI or source. There's no
    "first person wins" fallback: without the secret, this always 403s.
    """
    if not settings.ADMIN_BOOTSTRAP_SECRET or not secrets.compare_digest(
        secret, settings.ADMIN_BOOTSTRAP_SECRET
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid bootstrap secret")

    already_admin = db.query(AdminUser).filter(AdminUser.user_id == user.id).first() is not None
    if not already_admin:
        db.add(AdminUser(user_id=user.id))
        db.commit()

    return {"message": "You are now an admin", "is_admin": True}


@router.get("/admins")
def list_admins(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(User.id, User.email)
        .join(AdminUser, AdminUser.user_id == User.id)
        .order_by(User.id.asc())
        .all()
    )
    return [{"id": r.id, "email": r.email} for r in rows]


@router.post("/admins", status_code=status.HTTP_201_CREATED)
def grant_admin(
    email: str = Body(embed=True),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.email == email.strip().lower()).first()
    if not target:
        raise HTTPException(status_code=404, detail="No user with that email")

    exists = db.query(AdminUser).filter(AdminUser.user_id == target.id).first() is not None
    if not exists:
        db.add(AdminUser(user_id=target.id))
        db.commit()

    return {"message": f"{target.email} is now an admin"}


@router.delete("/admins/{user_id}")
def revoke_admin(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="You can't revoke your own admin access")

    row = db.query(AdminUser).filter(AdminUser.user_id == user_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="That user isn't an admin")

    db.delete(row)
    db.commit()

    return {"message": "Admin access revoked"}


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
