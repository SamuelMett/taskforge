import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.routes import auth, tasks
from app.core.config import settings
from app.core.limiter import limiter
from app.db.base import Base
from app.db.session import engine

if os.getenv("ENV", "").lower() == "prod" and settings.JWT_SECRET_KEY == "CHANGE_ME_IN_PROD":
    raise RuntimeError(
        "JWT_SECRET_KEY is still the default placeholder. "
        "Set a real JWT_SECRET_KEY env var before running in production."
    )

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

raw = os.getenv("CORS_ORIGINS", "")
origins = [o.strip() for o in raw.split(",") if o.strip()]

# optional: allow localhost during dev
if os.getenv("ENV", "").lower() != "prod":
    origins += [
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])