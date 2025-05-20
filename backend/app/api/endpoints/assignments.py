from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.core.auth import get_current_user, verify_admin
from app.core.config import settings
from app.models.assignment import (
    assign_leader_to_process,
    remove_leader_from_process,
    get_process_leaders,
    get_leader_processes,
    transfer_process_leadership
)
from app.models.user import get_users_by_role
from app.schemas.assignment import Assignment, AssignmentCreate
from app.schemas.user import User

router = APIRouter()


@router.post("/", response_model=Assignment)
async def assign_leader(
    assignment: AssignmentCreate,
    current_user: dict = Depends(verify_admin),
):
    """
    Assign a leader to a process.
    Only administrators can assign leaders to processes.
    """
    return await assign_leader_to_process(assignment, current_user["id"])


@router.delete("/{process_id}/{leader_id}", response_model=dict)
async def remove_leader(
    process_id: int,
    leader_id: int,
    current_user: dict = Depends(verify_admin),
):
    """
    Remove a leader from a process.
    Only administrators can remove leaders from processes.
    """
    success = await remove_leader_from_process(process_id, leader_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    return {"success": True, "message": "Leader removed from process"}


@router.get("/process/{process_id}/leaders", response_model=List[User])
async def get_leaders_for_process(
    process_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Get all leaders assigned to a process.
    """
    return await get_process_leaders(process_id)


@router.get("/leader/{leader_id}/processes")
async def get_processes_for_leader(
    leader_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Get all processes assigned to a leader.
    """
    # Check if user is requesting their own processes or is an admin
    if current_user["id"] != leader_id and settings.ROLE_ADMIN not in current_user["roles"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view other user's processes"
        )
    
    return await get_leader_processes(leader_id)


@router.post("/transfer", response_model=dict)
async def transfer_leadership(
    process_id: int,
    old_leader_id: int,
    new_leader_id: int,
    current_user: dict = Depends(verify_admin),
):
    """
    Transfer process leadership from one leader to another.
    Only administrators can transfer process leadership.
    """
    success = await transfer_process_leadership(process_id, old_leader_id, new_leader_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Failed to transfer leadership"
        )
    
    return {"success": True, "message": "Leadership transferred successfully"}


@router.get("/available-leaders", response_model=List[User])
async def get_available_leaders(
    current_user: dict = Depends(verify_admin),
):
    """
    Get all users with process_leader role that are active.
    Used for assigning leaders to processes.
    """
    return await get_users_by_role(settings.ROLE_PROCESS_LEADER)
