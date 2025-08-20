from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class AuditBase(BaseModel):
    entity_type: str = Field(..., description="Type of entity being audited (process, action, user)")
    entity_id: int = Field(..., description="ID of the entity being audited")
    details: str = Field(..., description="Audit log details")


class AuditCreate(AuditBase):
    pass


class AuditInDB(AuditBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class AuditOut(AuditInDB):
    user_name: str = None


class AuditFilter(BaseModel):
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    user_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    limit: Optional[int] = 100
    offset: Optional[int] = 0


class AuditReportBase(BaseModel):
    title: str = Field(..., description="Title of the audit report")
    content: str = Field(..., description="Main content of the audit report")
    process_id: Optional[int] = Field(None, description="ID of the process being audited")
    status: str = Field("draft", description="Status of the report (e.g., draft, submitted, completed)")
    file_path: Optional[str] = Field(None, description="Path to the generated PDF report file")


class AuditReportCreate(AuditReportBase):
    pass


class AuditReportUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None
    file_path: Optional[str] = None


class AuditReportInDBBase(AuditReportBase):
    id: int
    auditor_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AuditReport(AuditReportInDBBase):
    auditor_name: Optional[str] = None
    process_name: Optional[str] = None
