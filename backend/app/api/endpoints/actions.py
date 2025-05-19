from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from pydantic import parse_obj_as
import json

from app.core.auth import get_current_user
from app.core.config import settings
from app.models.action import (
    get_action_by_id,
    get_actions_by_process,
    get_actions_by_leader,
    create_action,
    update_action,
    delete_action,
    get_action_statistics,
    get_upcoming_deadlines
)
from app.models.process import get_process_by_id
from app.middleware.upload import save_upload, delete_file
from app.schemas.action import Action, ActionCreate, ActionUpdate, ActionStatistics

router = APIRouter()


@router.get("/process/{process_id}", response_model=List[Action])
async def read_actions_by_process(
    process_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Get all actions for a specific process.
    """
    # Check if process exists
    process = await get_process_by_id(process_id)
    if not process:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proceso no encontrado"
        )
    
    # Check permissions - only admin or process creator can access
    if current_user["role"] != settings.ROLE_ADMIN and process["created_by"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver estas acciones"
        )
    
    actions = await get_actions_by_process(process_id)
    return actions


@router.get("/leader/{leader_id}", response_model=List[Action])
async def read_actions_by_leader(
    leader_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Get all actions assigned to a specific leader.
    """
    # Check permissions - only admin or the leader can access
    if current_user["role"] != settings.ROLE_ADMIN and current_user["id"] != int(leader_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver estas acciones"
        )
    
    actions = await get_actions_by_leader(leader_id)
    return actions


@router.get("/statistics", response_model=ActionStatistics)
async def read_action_statistics(
    process_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
):
    """
    Get action statistics, optionally filtered by process.
    """
    # If filtering by process, check permissions
    if process_id:
        process = await get_process_by_id(process_id)
        if not process:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proceso no encontrado"
            )
        
        # Check permissions if not admin
        if current_user["role"] != settings.ROLE_ADMIN and process["created_by"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para ver estas estadísticas"
            )
    
    statistics = await get_action_statistics(process_id)
    return statistics


@router.get("/upcoming-deadlines", response_model=List[Action])
async def read_upcoming_deadlines(
    limit: int = Query(5, ge=1, le=20),
    process_id: Optional[int] = None,
    date_range: str = Query("month", regex="^(week|month|quarter|year)$"),
    current_user: dict = Depends(get_current_user),
):
    """
    Get actions with upcoming deadlines.
    """
    # If filtering by process, check permissions
    if process_id:
        process = await get_process_by_id(process_id)
        if not process:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proceso no encontrado"
            )
        
        # Check permissions if not admin
        if current_user["role"] != settings.ROLE_ADMIN and process["created_by"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para ver estas acciones"
            )
    
    actions = await get_upcoming_deadlines(limit, process_id, date_range)
    return actions


@router.get("/{action_id}", response_model=Action)
async def read_action(
    action_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Get a specific action by id.
    """
    action = await get_action_by_id(action_id)
    
    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Acción no encontrada"
        )
    
    # Check permissions - admin, process creator, or action leader can access
    is_admin = current_user["role"] == settings.ROLE_ADMIN
    is_process_owner = current_user["id"] == action.get("created_by")
    is_action_leader = current_user["id"] == action.get("leader_id")
    
    if not (is_admin or is_process_owner or is_action_leader):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver esta acción"
        )
    
    return action


@router.post("/", response_model=Action)
async def create_new_action(
    action_in: ActionCreate,
    current_user: dict = Depends(get_current_user),
):
    """
    Create new action.
    """
    # Check if process exists
    process = await get_process_by_id(action_in.process_id)
    if not process:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proceso no encontrado"
        )
    
    # Check permissions to create action for this process
    if current_user["role"] != settings.ROLE_ADMIN and process["created_by"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para crear acciones en este proceso"
        )
    
    try:
        action = await create_action(action_in, current_user["id"])
        return action
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/with-evidence", response_model=Action)
async def create_action_with_evidence(
    process_id: int = Form(...),
    leader_id: int = Form(...),
    name: str = Form(...),
    origin: Optional[str] = Form(None),
    start_date: Optional[str] = Form(None),
    target_date: Optional[str] = Form(None),
    what: Optional[str] = Form(None),
    why: Optional[str] = Form(None),
    how: Optional[str] = Form(None),
    where: Optional[str] = Form(None),
    status: Optional[str] = Form("pending"),
    completion_percentage: Optional[int] = Form(0),
    related_type: Optional[str] = Form(None),
    related_id: Optional[int] = Form(None),
    evidence: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
):
    """
    Create action with file upload support.
    """
    # Check if process exists
    process = await get_process_by_id(process_id)
    if not process:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proceso no encontrado"
        )
    
    # Check permissions
    if current_user["role"] != settings.ROLE_ADMIN and process["created_by"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para crear acciones en este proceso"
        )
    
    # Handle file upload if provided
    evidence_path = None
    if evidence:
        valid_types = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
        evidence_path = await save_upload(
            evidence,
            folder="evidence",
            valid_types=valid_types,
            max_size=settings.MAX_UPLOAD_SIZE
        )
    
    # Create action data
    action_data = ActionCreate(
        process_id=process_id,
        leader_id=leader_id,
        name=name,
        origin=origin,
        start_date=start_date,
        target_date=target_date,
        what=what,
        why=why,
        how=how,
        where=where,
        status=status,
        evidence=evidence_path,
        completion_percentage=completion_percentage,
        related_type=related_type,
        related_id=related_id
    )
    
    try:
        action = await create_action(action_data, current_user["id"])
        return action
    except Exception as e:
        # Clean up uploaded file if action creation fails
        if evidence_path:
            delete_file(evidence_path)
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{action_id}", response_model=Action)
async def update_action_info(
    action_id: int,
    action_in: ActionUpdate,
    current_user: dict = Depends(get_current_user),
):
    """
    Update an action.
    """
    # Check if action exists
    action = await get_action_by_id(action_id)
    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Acción no encontrada"
        )
    
    # Check permissions - admin, process creator, or action leader can update
    is_admin = current_user["role"] == settings.ROLE_ADMIN
    is_process_owner = current_user["id"] == action.get("created_by")
    is_action_leader = current_user["id"] == action.get("leader_id")
    
    if not (is_admin or is_process_owner or is_action_leader):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para actualizar esta acción"
        )
    
    # Leaders can only update certain fields unless they are also the process owner
    if is_action_leader and not (is_admin or is_process_owner):
        allowed_fields = {"status", "completion_percentage", "evidence"}
        provided_fields = set(action_in.model_dump(exclude_unset=True).keys())
        
        if not provided_fields.issubset(allowed_fields):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo puedes actualizar el estado, porcentaje de completado y evidencias"
            )
    
    updated_action = await update_action(action_id, action_in)
    
    return updated_action


@router.put("/{action_id}/with-evidence", response_model=Action)
async def update_action_with_evidence(
    action_id: int,
    name: Optional[str] = Form(None),
    leader_id: Optional[int] = Form(None),
    origin: Optional[str] = Form(None),
    start_date: Optional[str] = Form(None),
    target_date: Optional[str] = Form(None),
    completion_date: Optional[str] = Form(None),
    what: Optional[str] = Form(None),
    why: Optional[str] = Form(None),
    how: Optional[str] = Form(None),
    where: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    completion_percentage: Optional[int] = Form(None),
    related_type: Optional[str] = Form(None),
    related_id: Optional[int] = Form(None),
    evidence: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
):
    """
    Update action with file upload support.
    """
    # Check if action exists
    action = await get_action_by_id(action_id)
    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Acción no encontrada"
        )
    
    # Check permissions
    is_admin = current_user["role"] == settings.ROLE_ADMIN
    is_process_owner = current_user["id"] == action.get("created_by")
    is_action_leader = current_user["id"] == action.get("leader_id")
    
    if not (is_admin or is_process_owner or is_action_leader):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para actualizar esta acción"
        )
    
    # Create update data
    update_data = {}
    if name is not None:
        update_data["name"] = name
    if leader_id is not None:
        update_data["leader_id"] = leader_id
    if origin is not None:
        update_data["origin"] = origin
    if start_date is not None:
        update_data["start_date"] = start_date
    if target_date is not None:
        update_data["target_date"] = target_date
    if completion_date is not None:
        update_data["completion_date"] = completion_date
    if what is not None:
        update_data["what"] = what
    if why is not None:
        update_data["why"] = why
    if how is not None:
        update_data["how"] = how
    if where is not None:
        update_data["where"] = where
    if status is not None:
        update_data["status"] = status
    if completion_percentage is not None:
        update_data["completion_percentage"] = completion_percentage
    if related_type is not None:
        update_data["related_type"] = related_type
    if related_id is not None:
        update_data["related_id"] = related_id
    
    # Leaders can only update certain fields unless they are also the process owner
    if is_action_leader and not (is_admin or is_process_owner):
        allowed_fields = {"status", "completion_percentage", "evidence"}
        provided_fields = set(update_data.keys())
        
        if not provided_fields.issubset(allowed_fields):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo puedes actualizar el estado, porcentaje de completado y evidencias"
            )
    
    # Handle file upload if provided
    if evidence:
        # Delete old evidence if exists
        if action.get("evidence"):
            delete_file(action["evidence"])
        
        # Save new evidence
        valid_types = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
        evidence_path = await save_upload(
            evidence,
            folder="evidence",
            valid_types=valid_types,
            max_size=settings.MAX_UPLOAD_SIZE
        )
        update_data["evidence"] = evidence_path
    
    # Update action
    action_update = ActionUpdate(**update_data)
    updated_action = await update_action(action_id, action_update)
    
    return updated_action


@router.delete("/{action_id}", response_model=dict)
async def delete_action_by_id(
    action_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Delete an action.
    """
    # Check if action exists
    action = await get_action_by_id(action_id)
    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Acción no encontrada"
        )
    
    # Check permissions - only admin or process creator can delete
    if current_user["role"] != settings.ROLE_ADMIN and current_user["id"] != action.get("created_by"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar esta acción"
        )
    
    # Delete evidence file if exists
    if action.get("evidence"):
        delete_file(action["evidence"])
    
    # Delete action
    success = await delete_action(action_id)
    
    return {"success": success, "message": "Acción eliminada correctamente"}
