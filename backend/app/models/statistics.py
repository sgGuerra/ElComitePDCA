import logging
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, date, timedelta

from app.db.database import get_one, get_all
from app.models.action import get_action_by_id

logger = logging.getLogger(__name__)


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
        logger.error(f"Error getting dashboard statistics: {str(e)}")
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
        logger.error(f"Error getting actions by type: {str(e)}")
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
        # Add date filtering
        date_filter = ""
        if date_range == "week":
            date_filter = "AND (created_at >= date('now', '-7 days') OR updated_at >= date('now', '-7 days'))"
        elif date_range == "month":
            date_filter = "AND (created_at >= date('now', '-1 month') OR updated_at >= date('now', '-1 month'))"
        elif date_range == "quarter":
            date_filter = "AND (created_at >= date('now', '-3 months') OR updated_at >= date('now', '-3 months'))"
        elif date_range == "year":
            date_filter = "AND (created_at >= date('now', '-1 year') OR updated_at >= date('now', '-1 year'))"
        
        # Add process filter
        query_params = []
        
        # Query for counts
        query = """
            SELECT status, COUNT(*) as count
            FROM actions
            WHERE 1=1
        """
        
        if process_id:
            query += " AND process_id = ?"
            query_params.append(process_id)
            
        if date_filter:
            query += f" {date_filter}"
            
        query += " GROUP BY status"
        
        counts = await get_all(query, tuple(query_params))
        
        # If we need to include the actions, get them for each status
        if include_actions:
            for status_item in counts:
                status = status_item["status"]
                
                # Get actions for this status
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
                
                actions = await get_all(query, tuple(action_params))
                
                status_item["actions"] = actions
        
        return counts
    except Exception as e:
        logger.error(f"Error getting actions by status: {str(e)}")
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
        # Determine date range
        date_filter = ""
        if date_range == "week":
            date_filter = "AND target_date <= date('now', '+7 days')"
        elif date_range == "month":
            date_filter = "AND target_date <= date('now', '+1 month')"
        elif date_range == "quarter":
            date_filter = "AND target_date <= date('now', '+3 months')"
        elif date_range == "year":
            date_filter = "AND target_date <= date('now', '+1 year')"
        
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
        logger.error(f"Error getting upcoming deadlines: {str(e)}")
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
        # Add date filtering
        date_filter = ""
        if date_range == "week":
            date_filter = "AND (created_at >= date('now', '-7 days') OR updated_at >= date('now', '-7 days'))"
        elif date_range == "month":
            date_filter = "AND (created_at >= date('now', '-1 month') OR updated_at >= date('now', '-1 month'))"
        elif date_range == "quarter":
            date_filter = "AND (created_at >= date('now', '-3 months') OR updated_at >= date('now', '-3 months'))"
        elif date_range == "year":
            date_filter = "AND (created_at >= date('now', '-1 year') OR updated_at >= date('now', '-1 year'))"
        
        # Query with proper parameterization
        query_params = []
        
        # Get total count
        total_query = """
            SELECT COUNT(*) as count
            FROM actions
            WHERE 1=1
        """
        
        if process_id:
            total_query += " AND process_id = ?"
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
            completed_query += " AND process_id = ?"
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
        logger.error(f"Error getting completion rate: {str(e)}")
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
        # Determine interval and time span
        interval = "day"
        format_str = "%Y-%m-%d"
        group_by = "strftime('%Y-%m-%d', created_at)"
        
        if date_range == "week":
            days = 7
        elif date_range == "month":
            days = 30
        elif date_range == "quarter":
            days = 90
            interval = "week"
            format_str = "%Y-%W"
            group_by = "strftime('%Y-%W', created_at)"
        elif date_range == "year":
            days = 365
            interval = "month"
            format_str = "%Y-%m"
            group_by = "strftime('%Y-%m', created_at)"
        else:
            days = 30  # Default to month
        
        # Generate date series
        date_series = []
        today = datetime.now().date()
        
        for i in range(days, -1, -1):
            if interval == "day":
                date_point = today - timedelta(days=i)
                date_series.append(date_point.strftime(format_str))
            elif interval == "week":
                date_point = today - timedelta(days=i)
                week_num = date_point.strftime("%Y-%W")
                if week_num not in date_series:
                    date_series.append(week_num)
            elif interval == "month":
                date_point = today - timedelta(days=i)
                month = date_point.strftime("%Y-%m")
                if month not in date_series:
                    date_series.append(month)
        
        # Set up query parameters
        params = []
        process_condition = ""
        
        if process_id:
            process_condition = "AND process_id = ?"
            params.append(process_id)
        
        # Get action counts by date and status
        completed_by_date = await get_all(
            f"""
            SELECT {group_by} as date, COUNT(*) as count
            FROM actions
            WHERE status = 'completed' {process_condition}
            AND created_at >= date('now', '-{days} days')
            GROUP BY date
            ORDER BY date
            """,
            tuple(params)
        )
        
        pending_by_date = await get_all(
            f"""
            SELECT {group_by} as date, COUNT(*) as count
            FROM actions
            WHERE status IN ('pending', 'in_progress') {process_condition}
            AND created_at >= date('now', '-{days} days')
            GROUP BY date
            ORDER BY date
            """,
            tuple(params)
        )
        
        overdue_by_date = await get_all(
            f"""
            SELECT {group_by} as date, COUNT(*) as count
            FROM actions
            WHERE status = 'overdue' {process_condition}
            AND created_at >= date('now', '-{days} days')
            GROUP BY date
            ORDER BY date
            """,
            tuple(params)
        )
        
        # Convert to dictionaries for faster lookup
        completed_dict = {item["date"]: item["count"] for item in completed_by_date}
        pending_dict = {item["date"]: item["count"] for item in pending_by_date}
        overdue_dict = {item["date"]: item["count"] for item in overdue_by_date}
        
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
        logger.error(f"Error getting actions over time: {str(e)}")
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
        logger.error(f"Error getting process statistics: {str(e)}")
        return []
