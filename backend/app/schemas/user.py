from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    name: str = Field(..., max_length=255)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., max_length=255)
    roles: List[str] = ["process_leader"]
    
    model_config = ConfigDict(extra="forbid")


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, max_length=255)
    roles: Optional[List[str]] = None
    is_active: Optional[bool] = None
    
    model_config = ConfigDict(extra="forbid")


class UserInDBBase(UserBase):
    id: int
    roles: List[str]
    role: Optional[str] = None  # Single role representation for frontend compatibility
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
        
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
