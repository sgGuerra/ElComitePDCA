import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.db.database import get_one, get_all, insert, execute

logger = logging.getLogger(__name__)


class CommentBase:
    """Base class for comment operations."""
    
    @staticmethod
    async def _get_comments(table_name: str, foreign_key: str, entity_id: int) -> List[Dict[str, Any]]:
        """Get comments for an entity."""
        try:
            comments = await get_all(
                f"""
                SELECT c.*, u.name as user_name
                FROM {table_name} c
                JOIN users u ON c.user_id = u.id
                WHERE c.{foreign_key} = ?
                ORDER BY c.created_at DESC
                """,
                (entity_id,)
            )
            return comments
        except Exception as e:
            logger.error(f"Error getting comments from {table_name}: {e}")
            raise
    
    @staticmethod
    async def _add_comment(table_name: str, foreign_key: str, entity_id: int, user_id: int, comment: str) -> Dict[str, Any]:
        """Add a comment to an entity."""
        try:
            comment_id = await insert(
                f"""
                INSERT INTO {table_name} ({foreign_key}, user_id, comment)
                VALUES (?, ?, ?)
                """,
                (entity_id, user_id, comment)
            )
            
            # Get the inserted comment with user name
            comment_data = await get_one(
                f"""
                SELECT c.*, u.name as user_name
                FROM {table_name} c
                JOIN users u ON c.user_id = u.id
                WHERE c.id = ?
                """,
                (comment_id,)
            )
            
            return comment_data
        except Exception as e:
            logger.error(f"Error adding comment to {table_name}: {e}")
            raise
    
    @staticmethod
    async def _delete_comment(table_name: str, comment_id: int, user_id: int) -> bool:
        """Delete a comment."""
        try:
            # Check if the user is the comment author
            comment = await get_one(
                f"SELECT * FROM {table_name} WHERE id = ?",
                (comment_id,)
            )
            
            if not comment or comment['user_id'] != user_id:
                from app.core.config import settings
                
                # Check if user is admin
                user = await get_one(
                    "SELECT * FROM users WHERE id = ?",
                    (user_id,)
                )
                
                if not user or settings.ROLE_ADMIN not in user['roles'].split(','):
                    return False
            
            # Delete the comment
            await execute(
                f"DELETE FROM {table_name} WHERE id = ?",
                (comment_id,)
            )
            
            return True
        except Exception as e:
            logger.error(f"Error deleting comment from {table_name}: {e}")
            raise


class ProcessComments(CommentBase):
    """Process comments operations."""
    
    @staticmethod
    async def get_comments(process_id: int) -> List[Dict[str, Any]]:
        """Get comments for a process."""
        return await CommentBase._get_comments("process_comments", "process_id", process_id)
    
    @staticmethod
    async def add_comment(process_id: int, user_id: int, comment: str) -> Dict[str, Any]:
        """Add a comment to a process."""
        return await CommentBase._add_comment("process_comments", "process_id", process_id, user_id, comment)
    
    @staticmethod
    async def delete_comment(comment_id: int, user_id: int) -> bool:
        """Delete a process comment."""
        return await CommentBase._delete_comment("process_comments", comment_id, user_id)


class ActionComments(CommentBase):
    """Action comments operations."""
    
    @staticmethod
    async def get_comments(action_id: int) -> List[Dict[str, Any]]:
        """Get comments for an action."""
        return await CommentBase._get_comments("action_comments", "action_id", action_id)
    
    @staticmethod
    async def add_comment(action_id: int, user_id: int, comment: str) -> Dict[str, Any]:
        """Add a comment to an action."""
        return await CommentBase._add_comment("action_comments", "action_id", action_id, user_id, comment)
    
    @staticmethod
    async def delete_comment(comment_id: int, user_id: int) -> bool:
        """Delete an action comment."""
        return await CommentBase._delete_comment("action_comments", comment_id, user_id)
