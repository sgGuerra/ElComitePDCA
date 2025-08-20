import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.db.database import get_one, get_all, insert, execute
from app.models.notification import create_notification
from app.core.config import settings

logger = logging.getLogger(__name__)


async def create_deactivation_request(
    user_id: int,
    reason: str
) -> Dict[str, Any]:
    """Create a new user deactivation request."""
    try:
        # Check if there's an existing pending request
        existing_request = await get_one(
            "SELECT * FROM user_deactivation_requests WHERE user_id = ? AND status = 'pending'",
            (user_id,)
        )
        
        if existing_request:
            return existing_request
        
        # Insert the request
        request_id = await insert(
            """
            INSERT INTO user_deactivation_requests (user_id, reason)
            VALUES (?, ?)
            """,
            (user_id, reason)
        )
        
        # Get the inserted request with user information
        request = await get_one(
            """
            SELECT udr.*, u.name as user_name, u.email as user_email
            FROM user_deactivation_requests udr
            JOIN users u ON udr.user_id = u.id
            WHERE udr.id = ?
            """,
            (request_id,)
        )
        
        # Create a notification for all admins
        admins = await get_all(
            "SELECT * FROM users WHERE roles LIKE ?",
            (f"%{settings.ROLE_ADMIN}%",)
        )
        
        for admin in admins:
            await create_notification(
                admin['id'],
                "User Deactivation Request",
                f"User {request['user_name']} ({request['user_email']}) has requested account deactivation.",
                "user_deactivation",
                request_id
            )
        
        return request
    except Exception as e:
        logger.error(f"Error creating deactivation request: {e}")
        raise


async def get_deactivation_request_by_id(request_id: int) -> Optional[Dict[str, Any]]:
    """Get deactivation request by ID."""
    try:
        request = await get_one(
            """
            SELECT udr.*, u.name as user_name, u.email as user_email,
                   pu.name as processed_by_name
            FROM user_deactivation_requests udr
            JOIN users u ON udr.user_id = u.id
            LEFT JOIN users pu ON udr.processed_by = pu.id
            WHERE udr.id = ?
            """,
            (request_id,)
        )
        
        return request
    except Exception as e:
        logger.error(f"Error getting deactivation request by ID: {e}")
        raise


async def get_deactivation_requests(
    status: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Get deactivation requests with optional filtering."""
    try:
        query = """
            SELECT udr.*, u.name as user_name, u.email as user_email,
                   pu.name as processed_by_name
            FROM user_deactivation_requests udr
            JOIN users u ON udr.user_id = u.id
            LEFT JOIN users pu ON udr.processed_by = pu.id
            WHERE 1=1
        """
        params = []
        
        if status is not None:
            query += " AND udr.status = ?"
            params.append(status)
        
        query += " ORDER BY udr.created_at DESC"
        
        requests = await get_all(query, tuple(params))
        
        return requests
    except Exception as e:
        logger.error(f"Error getting deactivation requests: {e}")
        raise


async def process_deactivation_request(
    request_id: int,
    processor_id: int,
    approve: bool
) -> Optional[Dict[str, Any]]:
    """Process a deactivation request."""
    try:
        # Get the request
        request = await get_deactivation_request_by_id(request_id)
        
        if not request:
            return None
        
        if request['status'] != 'pending':
            return request
        
        # Update the request status
        status = 'approved' if approve else 'rejected'
        
        await execute(
            """
            UPDATE user_deactivation_requests
            SET status = ?, processed_at = CURRENT_TIMESTAMP, processed_by = ?
            WHERE id = ?
            """,
            (status, processor_id, request_id)
        )
        
        # If approved, deactivate the user
        if approve:
            await execute(
                "UPDATE users SET is_active = 0 WHERE id = ?",
                (request['user_id'],)
            )
        
        # Create a notification for the user
        action = "approved" if approve else "rejected"
        await create_notification(
            request['user_id'],
            "Deactivation Request Processed",
            f"Your account deactivation request has been {action}.",
            "user_deactivation",
            request_id
        )
        
        # Get the updated request
        return await get_deactivation_request_by_id(request_id)
    except Exception as e:
        logger.error(f"Error processing deactivation request: {e}")
        raise
