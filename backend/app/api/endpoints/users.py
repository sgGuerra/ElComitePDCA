from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.core.auth import get_current_user
from app.core.config import settings
from app.models.user import (
    get_all_users,
    get_user_by_id,
    create_user,
    update_user,
    delete_user
)
from app.schemas.user import User, UserCreate, UserUpdate

router = APIRouter()


@router.get("/", response_model=List[User])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
):
    """
    Get all users.
    Only admin users can access this endpoint.
    """
    if current_user["role"] != settings.ROLE_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver todos los usuarios"
        )
    
    users = await get_all_users()
    return users[skip : skip + limit]


@router.post("/", response_model=User)
async def create_new_user(
    user_in: UserCreate,
    current_user: dict = Depends(get_current_user),
):
    """
    Create new user.
    Only admin users can create users with admin role.
    """
    # Check if current user is admin when creating admin user
    if user_in.role == settings.ROLE_ADMIN and current_user["role"] != settings.ROLE_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para crear usuarios administradores"
        )
    
    try:
        user = await create_user(user_in)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
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
    if current_user["role"] != settings.ROLE_ADMIN and current_user["id"] != user_id:
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
    if current_user["role"] != settings.ROLE_ADMIN and current_user["id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para actualizar este usuario"
        )
    
    # Don't allow non-admins to change roles
    if user_in.role is not None and current_user["role"] != settings.ROLE_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para cambiar el rol de usuario"
        )
    
    user = await update_user(user_id, user_in)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return user


@router.delete("/{user_id}", response_model=dict)
async def delete_user_by_id(
    user_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Delete a user.
    Only admin users can delete users.
    """
    if current_user["role"] != settings.ROLE_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar usuarios"
        )
    
    success = await delete_user(user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return {"success": True, "message": "Usuario eliminado correctamente"}
