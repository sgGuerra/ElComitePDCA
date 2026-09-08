from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
import logging
from datetime import datetime

from app.core.auth import get_current_user, verify_admin
from app.core.config import settings
from app.models.user import (
    get_all_users,
    get_user_by_id,
    create_user,
    update_user,
    delete_user,
    get_users_by_role
)
from app.models.assignment import get_leader_processes, transfer_process_leadership
from app.schemas.user import User, UserCreate, UserUpdate, UserDeactivationRequest
from app.models.deactivation import create_deactivation_request

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", response_model=List[User])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(verify_admin),
):
    """
    Get all users.
    Only admin users can access this endpoint.
    """
    users = await get_all_users()
    return users[skip : skip + limit]


@router.post("/", response_model=User)
async def create_new_user(
    user_in: UserCreate,
    current_user: dict = Depends(verify_admin),
):
    """
    Create new user.
    Only admin users can create users.
    """
    try:
        user = await create_user(user_in)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/by-role/{role}", response_model=List[User])
async def get_users_with_role(
    role: str,
    current_user: dict = Depends(verify_admin),
):
    """
    Get all users with a specific role.
    Only admin users can access this endpoint.
    """
    users = await get_users_by_role(role)
    return users


@router.get("/process-leaders", response_model=List[User])
async def get_process_leaders_list(
    current_user: dict = Depends(get_current_user),
):
    """
    Get all users with process_leader role.
    This is used for selecting process owners in process management.
    """
    try:
        # Get users with process_leader role or admin role
        leaders = await get_users_by_role(settings.ROLE_PROCESS_LEADER)
        admins = await get_users_by_role(settings.ROLE_ADMIN)
        
        logger.info(f"Process leaders found: {len(leaders)}")
        logger.info(f"Admins found: {len(admins)}")
        
        # Combine and remove duplicates
        seen_ids = set()
        all_leaders = []
        
        for leader in leaders:
            if leader["id"] not in seen_ids:
                seen_ids.add(leader["id"])
                # Ensure every field required by the User model is present
                if "role" not in leader:
                    leader["role"] = settings.ROLE_PROCESS_LEADER
                # Ensure created_at and updated_at fields exist
                if "created_at" not in leader:
                    leader["created_at"] = datetime.utcnow()
                if "updated_at" not in leader:
                    leader["updated_at"] = datetime.utcnow()
                all_leaders.append(leader)
        
        for admin in admins:
            if admin["id"] not in seen_ids:
                seen_ids.add(admin["id"])
                # Ensure every field required by the User model is present
                if "role" not in admin:
                    admin["role"] = settings.ROLE_ADMIN
                # Ensure created_at and updated_at fields exist
                if "created_at" not in admin:
                    admin["created_at"] = datetime.utcnow()
                if "updated_at" not in admin:
                    admin["updated_at"] = datetime.utcnow()
                all_leaders.append(admin)
        
        # Filter out inactive users
        active_leaders = [leader for leader in all_leaders if leader.get("is_active", True)]
        
        logger.info(f"Total active leaders: {len(active_leaders)}")
        
        return active_leaders
    
    except Exception as e:
        logger.error(f"Error getting process leaders: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener líderes de procesos: {str(e)}"
        )


@router.get("/{user_id}", response_model=User)
async def read_user(
    user_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Get a specific user by id.
    Users can only access their own information unless they are admins.
    """
    # Users can view their own profile or admins can view any profile
    if settings.ROLE_ADMIN not in current_user["roles"] and current_user["id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver este usuario"
        )
    
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return user


@router.put("/{user_id}", response_model=User)
async def update_user_info(
    user_id: int,
    user_in: UserUpdate,
    current_user: dict = Depends(get_current_user),
):
    """
    Update a user.
    Users can only update their own information unless they are admins.
    Only admins can change user roles.
    """
    # Check permissions
    if settings.ROLE_ADMIN not in current_user["roles"] and current_user["id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para actualizar este usuario"
        )
    
    # Don't allow non-admins to change roles
    if user_in.roles is not None and settings.ROLE_ADMIN not in current_user["roles"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para cambiar los roles de usuario"
        )
    
    user = await update_user(user_id, user_in)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return user


@router.post("/request-deactivation", response_model=dict)
async def request_deactivation(
    request_data: UserDeactivationRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Request user deactivation.
    Users can request their own deactivation.
    """
    try:
        await create_deactivation_request(current_user["id"], request_data.reason)
        return {"success": True, "message": "Solicitud de desactivación enviada correctamente"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{user_id}/deactivate", response_model=dict)
async def deactivate_user(
    user_id: int,
    current_user: dict = Depends(verify_admin),
):
    """
    Deactivate a user.
    Only admin users can deactivate users.
    """
    # Check if user is a process leader with assigned processes
    if settings.ROLE_PROCESS_LEADER in (await get_user_by_id(user_id))["roles"]:
        processes = await get_leader_processes(user_id)
        if processes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este usuario tiene procesos asignados. Debe transferir los procesos antes de desactivar."
            )
    
    # Update user to inactive
    update_data = UserUpdate(is_active=False)
    user = await update_user(user_id, update_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return {"success": True, "message": "Usuario desactivado correctamente"}



@router.post("/{user_id}/transfer-processes/{new_leader_id}", response_model=dict)
async def transfer_user_processes(
    user_id: int,
    new_leader_id: int,
    current_user: dict = Depends(verify_admin),
):
    """
    Transfer all processes from one leader to another.
    This is used when deactivating a user who has processes assigned.
    Only admin users can transfer processes.
    """
    # Get all processes assigned to the user
    processes = await get_leader_processes(user_id)
    
    if not processes:
        return {"success": True, "message": "No hay procesos para transferir"}
    
    # Transfer each process to the new leader
    for process in processes:
        await transfer_process_leadership(process["id"], user_id, new_leader_id)
    
    return {
        "success": True, 
        "message": f"Se han transferido {len(processes)} procesos al nuevo líder"
    }

