from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel
from datetime import date, datetime


class DashboardStatistics(BaseModel):
    total_actions: int
    completed_actions: int
    pending_actions: int
    overdue_actions: int
    completion_rate: float
    last_action: Optional[Dict[str, Any]] = None


class ActionsByType(BaseModel):
    type: str
    count: int


class ActionsByStatus(BaseModel):
    status: str
    count: int
    actions: Optional[List[Dict[str, Any]]] = None


class UpcomingDeadlines(BaseModel):
    actions: List[Dict[str, Any]]


class CompletionRate(BaseModel):
    rate: float


class ActionsOverTime(BaseModel):
    date: str
    completed: int
    pending: int
    overdue: int


class ProcessStatsResponse(BaseModel):
    process_id: int
    process_name: str
    total_actions: int
    completed_actions: int
    pending_actions: int
    overdue_actions: int
    completion_rate: float


class StatisticsResponse(BaseModel):
    success: bool = True
    data: Union[
        List[ProcessStatsResponse],
        List[ActionsByType],
        List[ActionsByStatus],
        List[ActionsOverTime],
        UpcomingDeadlines,
        CompletionRate,
        DashboardStatistics
    ]
