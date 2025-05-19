from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.core.auth import get_current_user
from app.core.config import settings
from app.models.process import (
    get_all_processes,
    get_process_by_id,
    create_process,
    update_process,
    delete_process,
    get_process_statistics
)
from app.schemas.process import Process, ProcessCreate, ProcessUpdate, ProcessWithStats

router = APIRouter()


@router.get("/", response_model=List[Process])
async def read_processes(
    stats: bool = Query(False, description="Include process statistics"),
    current_user: dict = Depends(get_current_user),
):
    """
    Get all processes.
    
    If user is admin, return all processes.
    Otherwise, return only processes created by current user.
    """
    # Determine if we should filter by user
    user_id = None if current_user["role"] == settings.ROLE_ADMIN else current_user["id"]
    
    processes = await get_all_processes(user_id=user_id, include_stats=stats)
    return processes


@router.post("/", response_model=Process)
async def create_new_process(
    process_in: ProcessCreate,
    current_user: dict = Depends(get_current_user),
):
    """
    Create new process.
    """
    try:
        process = await create_process(process_in, current_user["id"])
        return process
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{process_id}", response_model=ProcessWithStats)
async def read_process(
    process_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Get a specific process by id.
    """
    process = await get_process_by_id(process_id)
    
    if not process:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proceso no encontrado"
        )
    
    # Check permissions - only admin or creator can access
    if current_user["role"] != settings.ROLE_ADMIN and process["created_by"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver este proceso"
        )
    
    # Get process statistics
    stats = await get_process_statistics(process_id)
    
    # Combine process data with statistics
    result = {**process, **stats}
    
    return result


@router.put("/{process_id}", response_model=Process)
async def update_process_info(
    process_id: int,
    process_in: ProcessUpdate,
    current_user: dict = Depends(get_current_user),
):
    """
    Update a process.
    """
    # Check if process exists
    process = await get_process_by_id(process_id)
    if not process:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proceso no encontrado"
        )
    
    # Check permissions - only admin or creator can update
    if current_user["role"] != settings.ROLE_ADMIN and process["created_by"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para actualizar este proceso"
        )
    
    # Update process
    updated_process = await update_process(process_id, process_in)
    
    return updated_process


@router.delete("/{process_id}", response_model=dict)
async def delete_process_by_id(
    process_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Delete a process.
    """
    # Check if process exists
    process = await get_process_by_id(process_id)
    if not process:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proceso no encontrado"
        )
    
    # Check permissions - only admin or creator can delete
    if current_user["role"] != settings.ROLE_ADMIN and process["created_by"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar este proceso"
        )
    
    # Delete process
    success = await delete_process(process_id)
    
    return {"success": success, "message": "Proceso eliminado correctamente"}
