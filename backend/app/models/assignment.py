import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.db.database import get_one, get_all, insert, execute
from app.schemas.assignment import AssignmentCreate, AssignmentUpdate

logger = logging.getLogger(__name__)


async def assign_leader_to_process(assignment_data: AssignmentCreate, admin_id: int) -> Dict[str, Any]:
    """Assign a leader to a process."""
    try:
        # Check if assignment already exists
        existing = await get_one(
            "SELECT * FROM process_leaders WHERE process_id = ? AND leader_id = ?",
            (assignment_data.process_id, assignment_data.leader_id)
        )
        
        if existing:
            return existing
            
        # Insert the assignment
        assignment_id = await insert(
            """
            INSERT INTO process_leaders (process_id, leader_id, created_by)
            VALUES (?, ?, ?)
            """,
            (assignment_data.process_id, assignment_data.leader_id, admin_id)
        )
        
        # Get the inserted assignment with related information
        assignment = await get_one(
            """
            SELECT pl.*, p.name as process_name, u.name as leader_name
            FROM process_leaders pl
            JOIN processes p ON pl.process_id = p.id
            JOIN users u ON pl.leader_id = u.id
            WHERE pl.id = ?
            """,
            (assignment_id,)
        )
        
        return assignment
    except Exception as e:
        logger.error(f"Error assigning leader to process: {e}")
        raise


async def remove_leader_from_process(process_id: int, leader_id: int) -> bool:
    """Remove a leader from a process."""
    try:
        await execute(
            "DELETE FROM process_leaders WHERE process_id = ? AND leader_id = ?",
            (process_id, leader_id)
        )
        return True
    except Exception as e:
        logger.error(f"Error removing leader from process: {e}")
        raise


async def get_process_leaders(process_id: int) -> List[Dict[str, Any]]:
    """Get all leaders assigned to a process."""
    try:
        leaders = await get_all(
            """
            SELECT u.id, u.name, u.email, u.roles, u.is_active, pl.created_at as assigned_at, 
                   u.created_at, u.updated_at
            FROM process_leaders pl
            JOIN users u ON pl.leader_id = u.id
            WHERE pl.process_id = ?
            """,
            (process_id,)
        )
        
        # Convert roles from string to list and ensure all required fields
        for leader in leaders:
            leader['roles'] = leader['roles'].split(',')
            
            # Add the role field for the schema
            if 'role' not in leader:
                leader['role'] = leader['roles'][0] if leader['roles'] else None
                
            # Ensure created_at and updated_at fields have values
            if 'created_at' not in leader or leader['created_at'] is None:
                leader['created_at'] = datetime.utcnow()
            if 'updated_at' not in leader or leader['updated_at'] is None:
                leader['updated_at'] = datetime.utcnow()
        
        return leaders
    except Exception as e:
        logger.error(f"Error getting process leaders: {e}")
        raise


async def get_leader_processes(leader_id: int) -> List[Dict[str, Any]]:
    """Get all processes assigned to a leader."""
    try:
        processes = await get_all(
            """
            SELECT p.*, pl.created_at as assigned_at
            FROM process_leaders pl
            JOIN processes p ON pl.process_id = p.id
            WHERE pl.leader_id = ?
            """,
            (leader_id,)
        )
        return processes
    except Exception as e:
        logger.error(f"Error getting leader processes: {e}")
        raise


async def transfer_process_leadership(process_id: int, old_leader_id: int, new_leader_id: int) -> bool:
    """Transfer process leadership from one leader to another."""
    try:
        # First, check if new leader is already assigned
        existing = await get_one(
            "SELECT * FROM process_leaders WHERE process_id = ? AND leader_id = ?",
            (process_id, new_leader_id)
        )
        
        if existing:
            # New leader already assigned, just remove old leader
            await remove_leader_from_process(process_id, old_leader_id)
        else:
            # Update the leader_id for the old assignment
            await execute(
                "UPDATE process_leaders SET leader_id = ? WHERE process_id = ? AND leader_id = ?",
                (new_leader_id, process_id, old_leader_id)
            )
        
        # Update actions assigned to old leader for this process
        await execute(
            "UPDATE actions SET leader_id = ? WHERE process_id = ? AND leader_id = ?",
            (new_leader_id, process_id, old_leader_id)
        )
        
        return True
    except Exception as e:
        logger.error(f"Error transferring process leadership: {e}")
        raise
