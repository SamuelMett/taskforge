from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.tasks import router as tasks_router

# ✅ add these imports
from app.db.session import engine
from app.db.base_class import Base

app = FastAPI(title="TaskForge API")

# ✅ create tables on startup (dev-friendly; later you’ll switch to Alembic)
Base.metadata.create_all(bind=engine)

# CORS (allow Vite dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(tasks_router, prefix="/tasks", tags=["tasks"])

@app.get("/health")
def health():
    return {"status": "ok"}
