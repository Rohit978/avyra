from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from backend.app.models.enums import UserRole


class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class UserLoginRequest(BaseModel):
    login: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=1)


class UserProfileUpdateRequest(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = Field(None, max_length=1000)
    current_password: Optional[str] = None
    new_password: Optional[str] = Field(None, min_length=8, max_length=128)


class UserResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    email: str
    role: UserRole
    is_active: bool
    avatar_url: Optional[str] = None
    created_at: datetime


class TokenResponseDTO(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponseDTO
