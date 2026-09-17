from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.core.auth import get_current_user
from app.models.statistics import (
    get_dashboard_statistics,
    get_actions_by_type,
    get_actions_by_status,
    get_upcoming_deadlines,
    get_completion_rate,
    get_actions_over_time,
    get_process_statistics
)
from app.models.process import get_process_by_id
from app.schemas.statistics import (
    DashboardStatistics,
    StatisticsResponse,
    ActionsByType,
    ActionsByStatus,
    UpcomingDeadlines,
    CompletionRate,
    ActionsOverTime,
    ProcessStatsResponse
)

router = APIRouter()


@router.get("/dashboard", response_model=DashboardStatistics)
async def get_statistics_dashboard(
    current_user: dict = Depends(get_current_user),
):
    """
    Get general dashboard statistics.
    """
    statistics = await get_dashboard_statistics()
    return statistics


@router.get("/actions-by-type", response_model=List[ActionsByType])
async def get_stats_actions_by_type(
    current_user: dict = Depends(get_current_user),
):
    """
    Get count of actions by type (origin field).
    """
    results = await get_actions_by_type()
    return results


@router.get("/actions-by-status", response_model=List[ActionsByStatus])
async def get_stats_actions_by_status(
    process_id: Optional[int] = None,
    date_range: str = Query("month", regex="^(week|month|quarter|year)$"),
    include_actions: bool = Query(False, description="Include the actual actions in the result"),
    limit: int = Query(5, ge=1, le=20),
    current_user: dict = Depends(get_current_user),
):
    """
    Get count of actions by status.
    """
    results = await get_actions_by_status(process_id, date_range, include_actions, limit)
    return results


@router.get("/upcoming-deadlines", response_model=List[Dict[str, Any]])
async def get_stats_upcoming_deadlines(
    limit: int = Query(5, ge=1, le=20),
    process_id: Optional[int] = None,
    date_range: str = Query("month", regex="^(week|month|quarter|year)$"),
    current_user: dict = Depends(get_current_user),
):
    """
    Get actions with upcoming deadlines.
    """
    results = await get_upcoming_deadlines(limit, process_id, date_range)
    return results


@router.get("/completion-rate", response_model=CompletionRate)
async def get_stats_completion_rate(
    process_id: Optional[int] = None,
    date_range: str = Query("month", regex="^(week|month|quarter|year)$"),
    current_user: dict = Depends(get_current_user),
):
    """
    Get action completion rate.
    """
    result = await get_completion_rate(process_id, date_range)
    return result


@router.get("/actions-over-time", response_model=List[ActionsOverTime])
async def get_stats_actions_over_time(
    process_id: Optional[int] = None,
    date_range: str = Query("month", regex="^(week|month|quarter|year)$"),
    current_user: dict = Depends(get_current_user),
):
    """
    Get action counts over time.
    """
    results = await get_actions_over_time(process_id, date_range)
    return results


@router.get("/processes", response_model=List[ProcessStatsResponse])
async def get_stats_processes(
    include_zero_counts: bool = Query(False, description="Include processes with no actions"),
    current_user: dict = Depends(get_current_user),
):
    """
    Get statistics for all processes.
    """
    results = await get_process_statistics(include_zero_counts)
    return results
