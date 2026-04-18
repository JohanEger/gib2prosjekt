from pydantic import BaseModel, EmailStr
from datetime import datetime
import uuid


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    phone_number: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    phone_number: str
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}
