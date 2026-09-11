import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, tasks

app = FastAPI()

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