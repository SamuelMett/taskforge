from fastapi import APIRouter

router = APIRouter()

@router.post("/register")
def register():
    return {"todo": "register"}

@router.post("/login")
def login():
    return {"todo": "login"}
