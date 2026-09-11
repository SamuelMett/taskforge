from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Login2FARequest(BaseModel):
    email: EmailStr
    password: str
    otp: str
