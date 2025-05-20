import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.db.database import get_one, get_all, insert, execute
from app.schemas.process import ProcessCreate, ProcessUpdate

logger = logging.getLogger(__name__)


async def create_process(process_data: ProcessCreate, user_id: int) -> Dict[str, Any]:
    """Create a new process."""
    try:
        process_id = await insert(
            "INSERT INTO processes (name, description, status, created_by) VALUES (?, ?, ?, ?)",
            (process_data.name, process_data.description, process_data.status, user_id)
        )
        
        process = await get_one("SELECT * FROM processes WHERE id = ?", (process_id,))
        return process
    except Exception as e:
        logger.error(f"Error creating process: {str(e)}")
        raise


async def get_process_by_id(process_id: int) -> Optional[Dict[str, Any]]:
    """Get process by ID."""
    try:
        process = await get_one("SELECT * FROM processes WHERE id = ?", (process_id,))
        return process
    except Exception as e:
        logger.error(f"Error getting process by ID: {str(e)}")
        return None


async def get_all_processes(user_id: Optional[int] = None, include_stats: bool = False) -> List[Dict[str, Any]]:
    """
    Get all processes, optionally filtered by user ID.
    
    Args:
        user_id: If provided, only return processes created by this user
        include_stats: If True, include action statistics for each process
        
    Returns:
        List of processes
    """
    try:
        query = "SELECT * FROM processes"
        params = []
        
        if user_id:
            query += " WHERE created_by = ?"
            params.append(user_id)
        
        query += " ORDER BY created_at DESC"
        
        processes = await get_all(query, tuple(params))
        
        # Include statistics if requested
        if include_stats and processes:
            for process in processes:
                stats = await get_process_statistics(process["id"])
                process.update(stats)
        
        return processes
    except Exception as e:
        logger.error(f"Error getting all processes: {str(e)}")
        return []


async def update_process(process_id: int, process_data: ProcessUpdate) -> Optional[Dict[str, Any]]:
    """Update a process."""
    try:
        # Check if process exists
        existing_process = await get_process_by_id(process_id)
        if not existing_process:
            return None
        
        # Prepare update fields
        update_fields = {}
        if process_data.name is not None:
            update_fields["name"] = process_data.name
        if process_data.description is not None:
            update_fields["description"] = process_data.description
        if process_data.status is not None:
            update_fields["status"] = process_data.status
        
        if not update_fields:
            return existing_process
        
        # Create SET part of SQL query
        set_clause = ", ".join([f"{field} = ?" for field in update_fields.keys()])
        set_clause += ", updated_at = datetime('now')"
        
        # Execute update
        await execute(
            f"UPDATE processes SET {set_clause} WHERE id = ?",
            (*update_fields.values(), process_id)
        )
        
        # Return updated process
        return await get_process_by_id(process_id)
    except Exception as e:
        logger.error(f"Error updating process: {str(e)}")
        return None


async def delete_process(process_id: int) -> bool:
    """Delete a process."""
    try:
        # Check if process exists
        existing_process = await get_process_by_id(process_id)
        if not existing_process:
            return False
        
        # Delete process
        await execute("DELETE FROM processes WHERE id = ?", (process_id,))
        return True
    except Exception as e:
        logger.error(f"Error deleting process: {str(e)}")
        return False


async def get_process_statistics(process_id: int) -> Dict[str, int]:
    """Get statistics for a process."""
    try:
        # Count total actions
        total_actions = await get_one(
            "SELECT COUNT(*) as count FROM actions WHERE process_id = ?",
            (process_id,)
        )
        
        # Count completed actions
        completed_actions = await get_one(
            "SELECT COUNT(*) as count FROM actions WHERE process_id = ? AND status = 'completed'",
            (process_id,)
        )
        
        # Count pending and in-progress actions
        pending_actions = await get_one(
            "SELECT COUNT(*) as count FROM actions WHERE process_id = ? AND status IN ('pending', 'in_progress')",
            (process_id,)
        )
        
        # Count overdue actions
        overdue_actions = await get_one(
            "SELECT COUNT(*) as count FROM actions WHERE process_id = ? AND status = 'overdue'",
            (process_id,)
        )
        
        return {
            "total_actions": total_actions["count"] if total_actions else 0,
            "completed_actions": completed_actions["count"] if completed_actions else 0,
            "pending_actions": pending_actions["count"] if pending_actions else 0,
            "overdue_actions": overdue_actions["count"] if overdue_actions else 0
        }
    except Exception as e:
        logger.error(f"Error getting process statistics: {str(e)}")
        return {
            "total_actions": 0,
            "completed_actions": 0,
            "pending_actions": 0,
            "overdue_actions": 0
        }


async def get_processes_by_leader(leader_id: int) -> List[Dict[str, Any]]:
    """Get all processes assigned to a leader."""
    try:
        query = """
            SELECT p.* 
            FROM processes p
            INNER JOIN process_leaders pl ON p.id = pl.process_id 
            WHERE pl.leader_id = ?
            ORDER BY p.created_at DESC
        """
        processes = await get_all(query, (leader_id,))
        return processes
    except Exception as e:
        logger.error(f"Error getting processes by leader: {str(e)}")
        return []
