from fastapi import FastAPI

from app.api.routes.auth import router as auth_router
from app.db.session import engine
from app.db.base import Base

from app.api.routes.tasks import router as tasks_router



# Import models so SQLAlchemy knows about them before creating tables
from app.models.user import User  # noqa: F401

app = FastAPI(title="TaskForge API")

# Temporary dev convenience: auto-create tables on startup
Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(tasks_router, prefix="/tasks", tags=["tasks"])
