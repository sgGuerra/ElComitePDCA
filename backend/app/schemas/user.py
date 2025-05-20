from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserCreate(UserBase):
    password: str
    roles: List[str] = ["process_leader"]


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    roles: Optional[List[str]] = None
    is_active: Optional[bool] = None


class UserInDBBase(UserBase):
    id: int
    roles: List[str]
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class User(UserInDBBase):
    pass


class UserInDB(UserInDBBase):
    password: str


class UserWithToken(User):
    token: str


class UserDeactivationRequest(BaseModel):
    reason: str
