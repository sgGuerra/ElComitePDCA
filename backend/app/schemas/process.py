from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class ProcessBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "active"
    owner: Optional[str] = None
    leader_id: Optional[int] = None
    priority: Optional[str] = "medium"
    departmentId: Optional[str] = None


class ProcessCreate(ProcessBase):
    pass


class ProcessUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    owner: Optional[str] = None
    leader_id: Optional[int] = None
    priority: Optional[str] = None
    departmentId: Optional[str] = None


class ProcessInDBBase(ProcessBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class Process(ProcessInDBBase):
    pass


class ProcessWithStats(Process):
    total_actions: int = 0
    completed_actions: int = 0
    pending_actions: int = 0
    overdue_actions: int = 0

