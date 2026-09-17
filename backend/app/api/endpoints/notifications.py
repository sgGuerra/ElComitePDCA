from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.core.auth import get_current_user
from app.models.notification import (
    get_notifications_by_user,
    get_notification_by_id,
    mark_notification_as_read,
    mark_all_notifications_as_read,
    delete_notification,
    get_unread_notification_count
)
from app.schemas.notification import Notification

router = APIRouter()


@router.get("/", response_model=List[Notification])
async def read_notifications(
    unread_only: bool = Query(False, description="Get only unread notifications"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    """
    Get notifications for the current user.
    """
    notifications = await get_notifications_by_user(
        user_id=current_user["id"],
        unread_only=unread_only,
        limit=limit,
        offset=offset
    )
    return notifications


@router.get("/count", response_model=Dict[str, int])
async def read_unread_notification_count(
    current_user: dict = Depends(get_current_user),
):
    """
    Get count of unread notifications for the current user.
    """
    count = await get_unread_notification_count(current_user["id"])
    return {"count": count}


@router.get("/{notification_id}", response_model=Notification)
async def read_notification(
    notification_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Get a specific notification by id.
    """
    notification = await get_notification_by_id(notification_id)
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificación no encontrada"
        )
    
    # Check if notification belongs to current user
    if notification["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver esta notificación"
        )
    
    return notification


@router.put("/{notification_id}/read", response_model=Notification)
async def mark_as_read(
    notification_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Mark a notification as read.
    """
    notification = await get_notification_by_id(notification_id)
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificación no encontrada"
        )
    
    # Check if notification belongs to current user
    if notification["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para actualizar esta notificación"
        )
    
    updated_notification = await mark_notification_as_read(notification_id)
    
    return updated_notification


@router.put("/read-all", response_model=Dict[str, int])
async def mark_all_as_read(
    current_user: dict = Depends(get_current_user),
):
    """
    Mark all notifications as read for the current user.
    """
    count = await mark_all_notifications_as_read(current_user["id"])
    
    return {"count": count}


@router.delete("/{notification_id}", response_model=Dict[str, bool])
async def delete_notification_by_id(
    notification_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Delete a notification.
    """
    notification = await get_notification_by_id(notification_id)
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificación no encontrada"
        )
    
    # Check if notification belongs to current user
    if notification["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar esta notificación"
        )
    
    success = await delete_notification(notification_id)
    
    return {"success": success}
