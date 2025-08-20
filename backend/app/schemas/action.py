from typing import Optional, List, Dict, Any
from datetime import date, datetime
from pydantic import BaseModel, Field


class ActionBase(BaseModel):
    name: str
    process_id: int
    leader_id: int
    origin: Optional[str] = None
    start_date: Optional[date] = None
    target_date: Optional[date] = None
    what: Optional[str] = None
    why: Optional[str] = None
    how: Optional[str] = None
    where: Optional[str] = None
    status: Optional[str] = "pending"
    evidence: Optional[str] = None
    completion_percentage: Optional[int] = 0
    related_type: Optional[str] = None
    related_id: Optional[int] = None


class ActionCreate(ActionBase):
    pass


class ActionUpdate(BaseModel):
    name: Optional[str] = None
    leader_id: Optional[int] = None
    origin: Optional[str] = None
    start_date: Optional[date] = None
    target_date: Optional[date] = None
    completion_date: Optional[date] = None
    what: Optional[str] = None
    why: Optional[str] = None
    how: Optional[str] = None
    where: Optional[str] = None
    status: Optional[str] = None
    evidence: Optional[str] = None
    completion_percentage: Optional[int] = None
    related_type: Optional[str] = None
    related_id: Optional[int] = None


class ActionInDBBase(ActionBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    completion_date: Optional[date] = None
    
    class Config:
        from_attributes = True


class Action(ActionInDBBase):
    leader_name: Optional[str] = None
    created_by_name: Optional[str] = None
    process_name: Optional[str] = None


class ActionStatistics(BaseModel):
    total: int
    completed: int
    pending: int
    overdue: int
    in_progress: int
    completion_rate: float
