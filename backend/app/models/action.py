import logging
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, date

from app.db.database import get_one, get_all, insert, execute
from app.schemas.action import ActionCreate, ActionUpdate
from app.models.notification import create_notification

logger = logging.getLogger(__name__)


async def create_action(action_data: ActionCreate, user_id: int) -> Dict[str, Any]:
    """Create a new action."""
    try:
        # Insert action into database
        action_id = await insert(
            """
            INSERT INTO actions (
                process_id, leader_id, name, origin, start_date, target_date,
                what, why, how, location, status, evidence, completion_percentage,
                created_by, related_type, related_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                action_data.process_id, action_data.leader_id, action_data.name,
                action_data.origin, action_data.start_date, action_data.target_date,
                action_data.what, action_data.why, action_data.how, action_data.where,
                action_data.status, action_data.evidence, action_data.completion_percentage,
                user_id, action_data.related_type, action_data.related_id
            )
        )
        
        # Notify the leader if it's not the same as the creator
        if action_data.leader_id != user_id:
            await create_notification(
                user_id=action_data.leader_id,
                title="Nueva acción asignada",
                message=f"Se te ha asignado una nueva acción: {action_data.name}",
                related_type="action",
                related_id=action_id
            )
        
        # Get created action with additional information
        action = await get_action_by_id(action_id)
        return action
    except Exception as e:
        logger.error(f"Error creating action: {str(e)}")
        raise


async def get_action_by_id(action_id: int) -> Optional[Dict[str, Any]]:
    """Get action by ID with related information."""
    try:
        # Get action with joins to get user and process names
        action = await get_one(
            """
            SELECT a.*, 
                   u1.name as leader_name, 
                   u2.name as created_by_name,
                   p.name as process_name
            FROM actions a
            LEFT JOIN users u1 ON a.leader_id = u1.id
            LEFT JOIN users u2 ON a.created_by = u2.id
            LEFT JOIN processes p ON a.process_id = p.id
            WHERE a.id = ?
            """,
            (action_id,)
        )
        return action
    except Exception as e:
        logger.error(f"Error getting action by ID: {str(e)}")
        return None


async def get_actions_by_process(process_id: int) -> List[Dict[str, Any]]:
    """Get all actions for a process."""
    try:
        actions = await get_all(
            """
            SELECT a.*, 
                   u1.name as leader_name, 
                   u2.name as created_by_name,
                   p.name as process_name
            FROM actions a
            LEFT JOIN users u1 ON a.leader_id = u1.id
            LEFT JOIN users u2 ON a.created_by = u2.id
            LEFT JOIN processes p ON a.process_id = p.id
            WHERE a.process_id = ?
            ORDER BY a.created_at DESC
            """,
            (process_id,)
        )
        return actions
    except Exception as e:
        logger.error(f"Error getting actions by process: {str(e)}")
        return []


async def get_actions_by_leader(leader_id: int) -> List[Dict[str, Any]]:
    """Get all actions assigned to a leader."""
    try:
        actions = await get_all(
            """
            SELECT a.*, 
                   u1.name as leader_name, 
                   u2.name as created_by_name,
                   p.name as process_name
            FROM actions a
            LEFT JOIN users u1 ON a.leader_id = u1.id
            LEFT JOIN users u2 ON a.created_by = u2.id
            LEFT JOIN processes p ON a.process_id = p.id
            WHERE a.leader_id = ?
            ORDER BY a.created_at DESC
            """,
            (leader_id,)
        )
        return actions
    except Exception as e:
        logger.error(f"Error getting actions by leader: {str(e)}")
        return []


async def update_action(action_id: int, action_data: ActionUpdate) -> Optional[Dict[str, Any]]:
    """Update an action."""
    try:
        # Check if action exists
        existing_action = await get_action_by_id(action_id)
        if not existing_action:
            return None
        
        # Prepare update fields
        update_fields = {}
        update_values = []
        
        # Status change detection for notifications
        old_status = existing_action["status"]
        status_changed = False
        
        # Handle all possible update fields
        for field, value in action_data.model_dump(exclude_unset=True).items():
            if value is not None:
                update_fields[field] = value
                update_values.append(value)
                
                # Track status change
                if field == "status" and value != old_status:
                    status_changed = True
        
        if not update_fields:
            return existing_action
        
        # Create SET part of SQL query
        set_clause = ", ".join([f"{field} = ?" for field in update_fields.keys()])
        set_clause += ", updated_at = datetime('now')"
        
        # Execute update
        await execute(
            f"UPDATE actions SET {set_clause} WHERE id = ?",
            (*update_values, action_id)
        )
        
        # Handle notifications for status changes
        if status_changed and "status" in update_fields:
            new_status = update_fields["status"]
            await _handle_status_change_notification(
                action_id, 
                existing_action["name"], 
                existing_action["leader_id"], 
                existing_action["created_by"],
                old_status, 
                new_status
            )
        
        # Return updated action
        return await get_action_by_id(action_id)
    except Exception as e:
        logger.error(f"Error updating action: {str(e)}")
        return None


async def delete_action(action_id: int) -> bool:
    """Delete an action."""
    try:
        # Check if action exists
        existing_action = await get_action_by_id(action_id)
        if not existing_action:
            return False
        
        # Delete action
        await execute("DELETE FROM actions WHERE id = ?", (action_id,))
        return True
    except Exception as e:
        logger.error(f"Error deleting action: {str(e)}")
        return False


async def get_action_statistics(process_id: Optional[int] = None) -> Dict[str, Any]:
    """Get action statistics, optionally filtered by process ID."""
    try:
        where_clause = "WHERE 1=1"
        params = []
        
        if process_id:
            where_clause += " AND process_id = ?"
            params.append(process_id)
        
        # Get total count
        total = await get_one(
            f"SELECT COUNT(*) as count FROM actions {where_clause}",
            tuple(params)
        )
        
        # Get counts by status
        completed = await get_one(
            f"SELECT COUNT(*) as count FROM actions {where_clause} AND status = 'completed'",
            tuple(params)
        )
        
        pending = await get_one(
            f"SELECT COUNT(*) as count FROM actions {where_clause} AND status = 'pending'",
            tuple(params)
        )
        
        in_progress = await get_one(
            f"SELECT COUNT(*) as count FROM actions {where_clause} AND status = 'in_progress'",
            tuple(params)
        )
        
        overdue = await get_one(
            f"SELECT COUNT(*) as count FROM actions {where_clause} AND status = 'overdue'",
            tuple(params)
        )
        
        # Calculate completion rate
        total_count = total["count"] if total else 0
        completed_count = completed["count"] if completed else 0
        completion_rate = (completed_count / total_count) * 100 if total_count > 0 else 0
        
        return {
            "total": total_count,
            "completed": completed_count,
            "pending": pending["count"] if pending else 0,
            "in_progress": in_progress["count"] if in_progress else 0,
            "overdue": overdue["count"] if overdue else 0,
            "completion_rate": round(completion_rate, 2)
        }
    except Exception as e:
        logger.error(f"Error getting action statistics: {str(e)}")
        return {
            "total": 0,
            "completed": 0,
            "pending": 0,
            "in_progress": 0,
            "overdue": 0,
            "completion_rate": 0
        }


async def get_upcoming_deadlines(limit: int = 5, process_id: Optional[int] = None, date_range: str = "month") -> List[Dict[str, Any]]:
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
        date_clause = ""
        if date_range == "week":
            date_clause = "AND target_date <= date('now', '+7 days')"
        elif date_range == "month":
            date_clause = "AND target_date <= date('now', '+1 month')"
        elif date_range == "quarter":
            date_clause = "AND target_date <= date('now', '+3 months')"
        elif date_range == "year":
            date_clause = "AND target_date <= date('now', '+1 year')"
        
        # Build query
        query = f"""
            SELECT a.*, 
                   u1.name as leader_name, 
                   u2.name as created_by_name,
                   p.name as process_name
            FROM actions a
            LEFT JOIN users u1 ON a.leader_id = u1.id
            LEFT JOIN users u2 ON a.created_by = u2.id
            LEFT JOIN processes p ON a.process_id = p.id
            WHERE a.status NOT IN ('completed', 'canceled')
            AND a.target_date IS NOT NULL
            AND a.target_date >= date('now')
            {date_clause}
        """
        
        params = []
        
        # Add process filter if specified
        if process_id:
            query += " AND a.process_id = ?"
            params.append(process_id)
        
        # Add ordering and limit
        query += " ORDER BY a.target_date ASC LIMIT ?"
        params.append(limit)
        
        # Execute query
        actions = await get_all(query, tuple(params))
        return actions
    except Exception as e:
        logger.error(f"Error getting upcoming deadlines: {str(e)}")
        return []


async def check_for_overdue_actions():
    """
    Check for actions that are past their due date and update their status.
    This should be run periodically.
    """
    try:
        # Update actions that are past their due date to 'overdue'
        await execute(
            """
            UPDATE actions
            SET status = 'overdue', updated_at = datetime('now')
            WHERE status NOT IN ('completed', 'canceled', 'overdue')
            AND target_date < date('now')
            """
        )
        
        # Get the affected actions to create notifications
        overdue_actions = await get_all(
            """
            SELECT a.*, u.name as leader_name
            FROM actions a
            JOIN users u ON a.leader_id = u.id
            WHERE a.status = 'overdue'
            AND a.updated_at >= datetime('now', '-1 day')
            """
        )
        
        # Create notifications for newly overdue actions
        for action in overdue_actions:
            await create_notification(
                user_id=action["leader_id"],
                title="Acción vencida",
                message=f"La acción '{action['name']}' ha vencido su plazo de entrega.",
                related_type="action",
                related_id=action["id"]
            )
        
        return len(overdue_actions)
    except Exception as e:
        logger.error(f"Error checking for overdue actions: {str(e)}")
        return 0


# Helper function for handling notifications on status changes
async def _handle_status_change_notification(
    action_id: int, 
    action_name: str, 
    leader_id: int, 
    created_by: int, 
    old_status: str, 
    new_status: str
):
    """Create notifications for status changes."""
    try:
        if new_status == "completed":
            # Notify creator if different from leader
            if created_by != leader_id:
                await create_notification(
                    user_id=created_by,
                    title="Acción completada",
                    message=f"La acción '{action_name}' ha sido marcada como completada.",
                    related_type="action",
                    related_id=action_id
                )
        elif new_status == "overdue":
            # Notify leader
            await create_notification(
                user_id=leader_id,
                title="Acción vencida",
                message=f"La acción '{action_name}' ha vencido su plazo de entrega.",
                related_type="action",
                related_id=action_id
            )
    except Exception as e:
        logger.error(f"Error creating status change notification: {str(e)}")
