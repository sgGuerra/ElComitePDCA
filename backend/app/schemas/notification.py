from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class NotificationBase(BaseModel):
    user_id: int
    title: str
    message: str
    related_type: Optional[str] = None
    related_id: Optional[int] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    read: Optional[bool] = None


class NotificationInDBBase(NotificationBase):
    id: int
    read: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True


class Notification(NotificationInDBBase):
    pass
