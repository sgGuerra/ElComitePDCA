from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class DeactivationRequestBase(BaseModel):
    reason: str = Field(..., description="Reason for requesting account deactivation")


class DeactivationRequestCreate(DeactivationRequestBase):
    pass


class DeactivationRequestProcess(BaseModel):
    approve: bool = Field(..., description="Whether to approve or reject the request")
    new_leader_id: Optional[int] = Field(None, description="ID of the new leader for any processes led by the user")


class DeactivationRequest(DeactivationRequestBase):
    id: int
    user_id: int
    user_name: str
    user_email: str
    status: str
    created_at: datetime
    processed_at: Optional[datetime] = None
    processed_by: Optional[int] = None
    processed_by_name: Optional[str] = None

    class Config:
        orm_mode = True


class DeactivationRequestWithProcesses(DeactivationRequest):
    led_processes: Optional[List[dict]] = Field(None, description="Processes led by the user requesting deactivation")
