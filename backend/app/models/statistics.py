import logging
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, date, timedelta

from app.db.database import get_one, get_all
from app.models.action import get_action_by_id

logger = logging.getLogger(__name__)

PROCESS_ID_FILTER_SQL = " AND process_id = ?"

# date_range -> fragmento SQL. Se sacó de las cadenas if/elif para que las funciones
# que los usan no se pasen del límite de complejidad cognitiva.
_RECENCY_DATE_FILTERS = {
    "week": "AND (created_at >= date('now', '-7 days') OR updated_at >= date('now', '-7 days'))",
    "month": "AND (created_at >= date('now', '-1 month') OR updated_at >= date('now', '-1 month'))",
    "quarter": "AND (created_at >= date('now', '-3 months') OR updated_at >= date('now', '-3 months'))",
    "year": "AND (created_at >= date('now', '-1 year') OR updated_at >= date('now', '-1 year'))",
}

_DEADLINE_DATE_FILTERS = {
    "week": "AND target_date <= date('now', '+7 days')",
    "month": "AND target_date <= date('now', '+1 month')",
    "quarter": "AND target_date <= date('now', '+3 months')",
    "year": "AND target_date <= date('now', '+1 year')",
}

_TIME_SERIES_CONFIG = {
    "week": (7, "day", "%Y-%m-%d", "strftime('%Y-%m-%d', created_at)"),
    "month": (30, "day", "%Y-%m-%d", "strftime('%Y-%m-%d', created_at)"),
    "quarter": (90, "week", "%Y-%W", "strftime('%Y-%W', created_at)"),
    "year": (365, "month", "%Y-%m", "strftime('%Y-%m', created_at)"),
}


def _get_recency_date_filter(date_range: str) -> str:
    """Filtro SQL para registros creados/actualizados hace poco, dentro de un rango de fechas."""
    return _RECENCY_DATE_FILTERS.get(date_range, "")


def _get_deadline_date_filter(date_range: str) -> str:
    """Filtro SQL para registros cuya target_date cae dentro de un rango de fechas."""
    return _DEADLINE_DATE_FILTERS.get(date_range, "")


def _get_time_series_config(date_range: str) -> Tuple[int, str, str, str]:
    """Devuelve (days, interval, format_str, group_by) según el rango de fechas de la tendencia."""
    return _TIME_SERIES_CONFIG.get(date_range, _TIME_SERIES_CONFIG["month"])


def _generate_date_series(today: date, days: int, interval: str, format_str: str) -> List[str]:
    """Arma la lista ordenada de etiquetas de periodo (días/semanas/meses) para el gráfico de tendencia."""
    series: List[str] = []
    for i in range(days, -1, -1):
        date_point = today - timedelta(days=i)
        label = date_point.strftime(format_str)
        if label not in series:
            series.append(label)
    return series


async def _fetch_actions_for_status(
    status: str, process_id: Optional[int], date_filter: str, limit: int
) -> List[Dict[str, Any]]:
    """Trae las acciones de un estado puntual, aplicando los mismos filtros que la consulta de conteo."""
    query = """
        SELECT a.*,
               u1.name as leader_name,
               p.name as process_name
        FROM actions a
        LEFT JOIN users u1 ON a.leader_id = u1.id
        LEFT JOIN processes p ON a.process_id = p.id
        WHERE a.status = ?
    """
    action_params = [status]

    if process_id:
        query += " AND a.process_id = ?"
        action_params.append(process_id)

    if date_filter:
        query += f" {date_filter}"

    query += " ORDER BY a.updated_at DESC LIMIT ?"
    action_params.append(limit)

    return await get_all(query, tuple(action_params))


async def get_dashboard_statistics() -> Dict[str, Any]:
    """Get general dashboard statistics."""
    try:
        # Count total actions
        total_actions = await get_one("SELECT COUNT(*) as count FROM actions")
        
        # Count actions by status
        completed = await get_one("SELECT COUNT(*) as count FROM actions WHERE status = 'completed'")
        pending = await get_one("SELECT COUNT(*) as count FROM actions WHERE status = 'pending'")
        overdue = await get_one("SELECT COUNT(*) as count FROM actions WHERE status = 'overdue'")
        
        # Calculate completion rate
        total = total_actions["count"] if total_actions else 0
        completed_count = completed["count"] if completed else 0
        completion_rate = round((completed_count / total) * 100, 2) if total > 0 else 0
        
        # Get last action
        last_action = await get_one(
            """
            SELECT a.*, u.name as leader_name
            FROM actions a
            LEFT JOIN users u ON a.leader_id = u.id
            ORDER BY a.created_at DESC
            LIMIT 1
            """
        )
        
        return {
            "total_actions": total,
            "completed_actions": completed_count,
            "pending_actions": pending["count"] if pending else 0,
            "overdue_actions": overdue["count"] if overdue else 0,
            "completion_rate": completion_rate,
            "last_action": last_action
        }
    except Exception as e:
        logger.exception("Error getting dashboard statistics")
        return {
            "total_actions": 0,
            "completed_actions": 0,
            "pending_actions": 0,
            "overdue_actions": 0,
            "completion_rate": 0,
            "last_action": None
        }


async def get_actions_by_type() -> List[Dict[str, Any]]:
    """Get count of actions by type (origin field)."""
    try:
        # If origin is NULL, replace with 'other'
        results = await get_all(
            """
            SELECT 
                CASE 
                    WHEN origin IS NULL OR origin = '' THEN 'other' 
                    ELSE origin 
                END as type,
                COUNT(*) as count
            FROM actions
            GROUP BY type
            ORDER BY count DESC
            """
        )
        return results
    except Exception as e:
        logger.exception("Error getting actions by type")
        return []


async def get_actions_by_status(
    process_id: Optional[int] = None,
    date_range: str = "month",
    include_actions: bool = False,
    limit: int = 5
) -> List[Dict[str, Any]]:
    """
    Get count of actions by status.
    
    Args:
        process_id: Optional process ID to filter by
        date_range: Time range for filtering (week, month, quarter, year)
        include_actions: Whether to include the actual actions in the result
        limit: Maximum number of actions to include per status
        
    Returns:
        List of actions grouped by status
    """
    try:
        date_filter = _get_recency_date_filter(date_range)

        # Add process filter
        query_params = []

        # Query for counts
        query = """
            SELECT status, COUNT(*) as count
            FROM actions
            WHERE 1=1
        """

        if process_id:
            query += PROCESS_ID_FILTER_SQL
            query_params.append(process_id)

        if date_filter:
            query += f" {date_filter}"

        query += " GROUP BY status"

        counts = await get_all(query, tuple(query_params))

        # If we need to include the actions, get them for each status
        if include_actions:
            for status_item in counts:
                status_item["actions"] = await _fetch_actions_for_status(
                    status_item["status"], process_id, date_filter, limit
                )

        return counts
    except Exception as e:
        logger.exception("Error getting actions by status")
        return []


async def get_upcoming_deadlines(
    limit: int = 5,
    process_id: Optional[int] = None,
    date_range: str = "month"
) -> List[Dict[str, Any]]:
    """
    Get actions with upcoming deadlines.
    
    Args:
        limit: Maximum number of actions to return
        process_id: Optional process ID to filter by
        date_range: Time range for deadlines (week, month, quarter, year)
        
    Returns:
        List of actions with upcoming deadlines
    """
    try:
        date_filter = _get_deadline_date_filter(date_range)

        # Build query with proper parameterization
        query_params = [limit]  # Start with limit as a parameter
        
        query = """
            SELECT a.*, 
                   u1.name as leader_name,
                   p.name as process_name
            FROM actions a
            LEFT JOIN users u1 ON a.leader_id = u1.id
            LEFT JOIN processes p ON a.process_id = p.id
            WHERE a.status NOT IN ('completed', 'canceled')
            AND a.target_date IS NOT NULL
            AND a.target_date >= date('now')
        """
        
        if date_filter:
            query += f" {date_filter}"
            
        if process_id:
            query += " AND a.process_id = ?"
            query_params.insert(0, process_id)  # Insert process_id before limit
            
        query += " ORDER BY a.target_date ASC LIMIT ?"
        
        # Get upcoming deadlines with proper parameters
        actions = await get_all(query, tuple(query_params))
        
        return actions
    except Exception as e:
        logger.exception("Error getting upcoming deadlines")
        return []


async def get_completion_rate(
    process_id: Optional[int] = None,
    date_range: str = "month"
) -> Dict[str, float]:
    """
    Get action completion rate.
    
    Args:
        process_id: Optional process ID to filter by
        date_range: Time range for filtering (week, month, quarter, year)
        
    Returns:
        Completion rate as a percentage
    """
    try:
        date_filter = _get_recency_date_filter(date_range)

        # Query with proper parameterization
        query_params = []
        
        # Get total count
        total_query = """
            SELECT COUNT(*) as count
            FROM actions
            WHERE 1=1
        """
        
        if process_id:
            total_query += PROCESS_ID_FILTER_SQL
            query_params.append(process_id)
            
        if date_filter:
            total_query += f" {date_filter}"
        
        total = await get_one(total_query, tuple(query_params))
        
        # Get completed count - reuse the same parameters
        completed_query = """
            SELECT COUNT(*) as count
            FROM actions
            WHERE status = 'completed'
        """
        
        if process_id:
            completed_query += PROCESS_ID_FILTER_SQL
            # We reuse the same parameters as before
            
        if date_filter:
            completed_query += f" {date_filter}"
        
        completed = await get_one(completed_query, tuple(query_params))
        
        # Calculate completion rate
        total_count = total["count"] if total else 0
        completed_count = completed["count"] if completed else 0
        rate = round((completed_count / total_count) * 100, 2) if total_count > 0 else 0
        
        return {"rate": rate}
    except Exception as e:
        logger.exception("Error getting completion rate")
        return {"rate": 0}


async def get_actions_over_time(
    process_id: Optional[int] = None,
    date_range: str = "month"
) -> List[Dict[str, Any]]:
    """
    Get action counts over time.
    
    Args:
        process_id: Optional process ID to filter by
        date_range: Time range for filtering (week, month, quarter, year)
        
    Returns:
        List of action counts by date
    """
    try:
        days, interval, format_str, group_by = _get_time_series_config(date_range)
        today = datetime.now().date()
        date_series = _generate_date_series(today, days, interval, format_str)

        params = []
        process_condition = ""
        if process_id:
            process_condition = "AND process_id = ?"
            params.append(process_id)

        async def _count_by_date(status_clause: str) -> Dict[str, int]:
            rows = await get_all(
                f"""
                SELECT {group_by} as date, COUNT(*) as count
                FROM actions
                WHERE {status_clause} {process_condition}
                AND created_at >= date('now', '-{days} days')
                GROUP BY date
                ORDER BY date
                """,
                tuple(params)
            )
            return {item["date"]: item["count"] for item in rows}

        completed_dict = await _count_by_date("status = 'completed'")
        pending_dict = await _count_by_date("status IN ('pending', 'in_progress')")
        overdue_dict = await _count_by_date("status = 'overdue'")

        # Combine results
        result = []
        for date_str in date_series:
            result.append({
                "date": date_str,
                "completed": completed_dict.get(date_str, 0),
                "pending": pending_dict.get(date_str, 0),
                "overdue": overdue_dict.get(date_str, 0)
            })
        
        return result
    except Exception as e:
        logger.exception("Error getting actions over time")
        return []


async def get_process_statistics(include_zero_counts: bool = False) -> List[Dict[str, Any]]:
    """Get statistics for all processes."""
    try:
        # Get all processes with their action statistics
        processes = await get_all(
            """
            SELECT 
                p.id as process_id,
                p.name as process_name,
                COUNT(a.id) as total_actions,
                SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed_actions,
                SUM(CASE WHEN a.status IN ('pending', 'in_progress') THEN 1 ELSE 0 END) as pending_actions,
                SUM(CASE WHEN a.status = 'overdue' THEN 1 ELSE 0 END) as overdue_actions
            FROM processes p
            LEFT JOIN actions a ON p.id = a.process_id
            GROUP BY p.id, p.name
            ORDER BY total_actions DESC
            """
        )
        
        # Calculate completion rate for each process
        for process in processes:
            total = process["total_actions"]
            completed = process["completed_actions"]
            
            # Skip processes with no actions if requested
            if total == 0 and not include_zero_counts:
                continue
            
            process["completion_rate"] = round((completed / total) * 100, 2) if total > 0 else 0
        
        return processes
    except Exception as e:
        logger.exception("Error getting process statistics")
        return []
