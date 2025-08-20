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
    role: Optional[str] = None  # Single role representation for frontend compatibility
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        
    def __init__(self, **data):
        super().__init__(**data)
        # If role isn't provided but roles is, set role to the first role in the list
        if self.role is None and self.roles:
            self.role = self.roles[0]


class User(UserInDBBase):
    pass


class UserInDB(UserInDBBase):
    password: str


class UserWithToken(User):
    token: str


class UserDeactivationRequest(BaseModel):
    reason: str
