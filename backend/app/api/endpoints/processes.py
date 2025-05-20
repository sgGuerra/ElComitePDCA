from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.core.auth import get_current_user, verify_admin
from app.core.config import settings
from app.models.process import (
    get_all_processes,
    get_process_by_id,
    create_process,
    update_process,
    delete_process,
    get_process_statistics
)
from app.models.assignment import get_leader_processes, get_process_leaders
from app.schemas.process import Process, ProcessCreate, ProcessUpdate, ProcessWithStats

router = APIRouter()


@router.get("/", response_model=List[Process])
async def read_processes(
    stats: bool = Query(False, description="Include process statistics"),
    current_user: dict = Depends(get_current_user),
):
    """
    Get processes based on user role.
    
    - If user is admin, return all processes.
    - If user is process_leader, return processes they are assigned to.
    """
    processes = []
    
    # Check user's active role to determine which processes to return
    if settings.ROLE_ADMIN in current_user["roles"] and current_user["active_role"] == settings.ROLE_ADMIN:
        # Admin sees all processes
        processes = await get_all_processes(include_stats=stats)
    elif settings.ROLE_PROCESS_LEADER in current_user["roles"]:
        # Process leader sees assigned processes
        processes = await get_leader_processes(current_user["id"])
        
        # Add stats if requested
        if stats and processes:
            for process in processes:
                stats_data = await get_process_statistics(process["id"])
                process.update(stats_data)
    
    return processes


@router.post("/", response_model=Process)
async def create_new_process(
    process_in: ProcessCreate,
    current_user: dict = Depends(verify_admin),
):
    """
    Create new process.
    Only admins can create processes.
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
    Access is allowed for:
    - Admins (active admin role)
    - Process creator
    - Leaders assigned to the process
    - Auditors if process is 'pending_audit'
    """
    process = await get_process_by_id(process_id)
    
    if not process:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proceso no encontrado"
        )
    
    # Check permissions
    has_access = False
    active_role = current_user.get("active_role")

    # Admin always has access if their active role is admin
    if settings.ROLE_ADMIN in current_user["roles"] and active_role == settings.ROLE_ADMIN:
        has_access = True
    # Process creator has access
    elif process["created_by"] == current_user["id"]:
        has_access = True
    # Check if user is a leader assigned to this process
    elif settings.ROLE_PROCESS_LEADER in current_user["roles"] and active_role == settings.ROLE_PROCESS_LEADER:
        process_leaders = await get_process_leaders(process_id)
        leader_ids = [leader["id"] for leader in process_leaders]
        if current_user["id"] in leader_ids:
            has_access = True
    # Auditor has access if process is pending_audit and their active role is auditor
    elif settings.ROLE_AUDITOR in current_user["roles"] and active_role == settings.ROLE_AUDITOR and process.get("status") == "pending_audit":
        has_access = True
    
    if not has_access:
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
    Only admins and process creators can update processes.
    """
    # Check if process exists
    process = await get_process_by_id(process_id)
    if not process:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proceso no encontrado"
        )
    
    # Check permissions - only admin or creator can update
    if (settings.ROLE_ADMIN not in current_user["roles"] or current_user["active_role"] != settings.ROLE_ADMIN) and process["created_by"] != current_user["id"]:
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
    current_user: dict = Depends(verify_admin),
):
    """
    Delete a process.
    Only admins can delete processes.
    """
    # Check if process exists
    process = await get_process_by_id(process_id)
    if not process:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proceso no encontrado"
        )
    
    # Delete process
    success = await delete_process(process_id)
    
    return {"success": success, "message": "Proceso eliminado correctamente"}


@router.get("/{process_id}/leaders", response_model=List[dict])
async def get_process_assigned_leaders(
    process_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Get all leaders assigned to a process.
    """
    process = await get_process_by_id(process_id)
    if not process:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proceso no encontrado"
        )
    
    leaders = await get_process_leaders(process_id)
    return leaders
