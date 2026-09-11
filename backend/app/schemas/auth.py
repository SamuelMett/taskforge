from pydantic import BaseModel, EmailStr, field_validator

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Login2FARequest(BaseModel):
    email: EmailStr
    password: str
    otp: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_len(cls, v: str):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v
