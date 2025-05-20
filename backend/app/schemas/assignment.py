from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class AssignmentBase(BaseModel):
    process_id: int
    leader_id: int


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(BaseModel):
    process_id: Optional[int] = None
    leader_id: Optional[int] = None


class AssignmentInDBBase(AssignmentBase):
    id: int
    created_by: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class Assignment(AssignmentInDBBase):
    leader_name: str
    process_name: str
