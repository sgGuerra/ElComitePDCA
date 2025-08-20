import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
import uuid

from fastapi import UploadFile, HTTPException, status
from app.db.database import get_one, get_all, insert, execute
from app.core.config import settings
from app.middleware.upload import save_upload, delete_file

logger = logging.getLogger(__name__)


async def add_resource_to_action(
    action_id: int,
    file: UploadFile,
    user_id: int
) -> Dict[str, Any]:
    """Add a resource file to an action."""
    try:
        # Save the uploaded file
        folder = f"actions/{action_id}/resources"
        file_path = save_upload(file, folder=folder)
        
        # Insert the resource record
        resource_id = await insert(
            """
            INSERT INTO action_resources (
                action_id, filename, file_path, content_type, file_size, uploaded_by
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                action_id,
                file.filename,
                file_path,
                file.content_type,
                file.size,
                user_id
            )
        )
        
        # Get the inserted resource with user name
        resource = await get_one(
            """
            SELECT r.*, u.name as uploaded_by_name
            FROM action_resources r
            JOIN users u ON r.uploaded_by = u.id
            WHERE r.id = ?
            """,
            (resource_id,)
        )
        
        return resource
    except Exception as e:
        logger.error(f"Error adding resource to action: {e}")
        raise


async def get_action_resources(action_id: int) -> List[Dict[str, Any]]:
    """Get all resources for an action."""
    try:
        resources = await get_all(
            """
            SELECT r.*, u.name as uploaded_by_name
            FROM action_resources r
            JOIN users u ON r.uploaded_by = u.id
            WHERE r.action_id = ?
            ORDER BY r.created_at DESC
            """,
            (action_id,)
        )
        
        return resources
    except Exception as e:
        logger.error(f"Error getting action resources: {e}")
        raise


async def get_resource_by_id(resource_id: int) -> Optional[Dict[str, Any]]:
    """Get a resource by ID."""
    try:
        resource = await get_one(
            """
            SELECT r.*, u.name as uploaded_by_name
            FROM action_resources r
            JOIN users u ON r.uploaded_by = u.id
            WHERE r.id = ?
            """,
            (resource_id,)
        )
        
        return resource
    except Exception as e:
        logger.error(f"Error getting resource by ID: {e}")
        raise


async def delete_action_resource(resource_id: int) -> bool:
    """Delete a resource from an action."""
    try:
        # Get the resource to find the file path
        resource = await get_resource_by_id(resource_id)
        
        if not resource:
            return False
        
        # Delete the file
        file_deleted = delete_file(resource['file_path'])
        
        if not file_deleted:
            logger.warning(f"Could not delete file: {resource['file_path']}")
        
        # Delete the resource record
        await execute(
            "DELETE FROM action_resources WHERE id = ?",
            (resource_id,)
        )
        
        return True
    except Exception as e:
        logger.error(f"Error deleting action resource: {e}")
        raise
