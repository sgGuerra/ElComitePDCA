import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.db.database import get_one, get_all, insert, execute
from app.schemas.notification import NotificationCreate, NotificationUpdate

logger = logging.getLogger(__name__)


async def create_notification(
    user_id: int,
    title: str,
    message: str,
    related_type: Optional[str] = None,
    related_id: Optional[int] = None
) -> Dict[str, Any]:
    """Create a new notification."""
    try:
        notification_id = await insert(
            """
            INSERT INTO notifications (user_id, title, message, related_type, related_id)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, title, message, related_type, related_id)
        )
        
        notification = await get_one(
            "SELECT * FROM notifications WHERE id = ?",
            (notification_id,)
        )
        
        return notification
    except Exception as e:
        logger.error(f"Error creating notification: {str(e)}")
        raise


async def get_notification_by_id(notification_id: int) -> Optional[Dict[str, Any]]:
    """Get notification by ID."""
    try:
        notification = await get_one(
            "SELECT * FROM notifications WHERE id = ?",
            (notification_id,)
        )
        return notification
    except Exception as e:
        logger.error(f"Error getting notification by ID: {str(e)}")
        return None


async def get_notifications_by_user(
    user_id: int,
    unread_only: bool = False,
    limit: int = 50,
    offset: int = 0
) -> List[Dict[str, Any]]:
    """Get notifications for a user."""
    try:
        query = "SELECT * FROM notifications WHERE user_id = ?"
        params = [user_id]
        
        if unread_only:
            query += " AND read = 0"
        
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        notifications = await get_all(query, tuple(params))
        return notifications
    except Exception as e:
        logger.error(f"Error getting notifications for user: {str(e)}")
        return []


async def mark_notification_as_read(notification_id: int) -> Optional[Dict[str, Any]]:
    """Mark a notification as read."""
    try:
        # Check if notification exists
        notification = await get_notification_by_id(notification_id)
        if not notification:
            return None
        
        # Mark as read
        await execute(
            "UPDATE notifications SET read = 1 WHERE id = ?",
            (notification_id,)
        )
        
        # Return updated notification
        return await get_notification_by_id(notification_id)
    except Exception as e:
        logger.error(f"Error marking notification as read: {str(e)}")
        return None


async def mark_all_notifications_as_read(user_id: int) -> int:
    """Mark all notifications for a user as read."""
    try:
        result = await execute(
            "UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0",
            (user_id,)
        )
        
        # Return number of affected rows (not directly available in this implementation)
        # Count unread notifications before update
        unread_count = await get_one(
            "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0",
            (user_id,)
        )
        
        return unread_count["count"] if unread_count else 0
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {str(e)}")
        return 0


async def delete_notification(notification_id: int) -> bool:
    """Delete a notification."""
    try:
        # Check if notification exists
        notification = await get_notification_by_id(notification_id)
        if not notification:
            return False
        
        # Delete notification
        await execute(
            "DELETE FROM notifications WHERE id = ?",
            (notification_id,)
        )
        
        return True
    except Exception as e:
        logger.error(f"Error deleting notification: {str(e)}")
        return False


async def get_unread_notification_count(user_id: int) -> int:
    """Get count of unread notifications for a user."""
    try:
        result = await get_one(
            "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0",
            (user_id,)
        )
        
        return result["count"] if result else 0
    except Exception as e:
        logger.error(f"Error getting unread notification count: {str(e)}")
        return 0
