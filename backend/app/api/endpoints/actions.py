from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
import json
import logging

from app.core.auth import get_current_user
from app.core.config import settings

# Set up logger
logger = logging.getLogger(__name__)
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
from app.models.resource import (
    add_resource_to_action,
    get_action_resources,
    get_resource_by_id,
    delete_action_resource
)

router = APIRouter()

PROCESS_NOT_FOUND = "Proceso no encontrado"
ACTION_NOT_FOUND = "Acción no encontrada"
NO_PERMISSION_VIEW_ACTIONS = "No tienes permisos para ver estas acciones"
GENERIC_ERROR_CREATE = "Hubo un problema al crear la acción. Verifica los datos e inténtalo de nuevo."
GENERIC_ERROR_UPLOAD = "Hubo un problema al procesar el archivo adjunto. Verifica el formato y tamaño permitidos."


def _check_process_permissions(process: dict, current_user: dict, action_desc: str = "ver estas acciones") -> None:
    if current_user["active_role"] != settings.ROLE_ADMIN and process["created_by"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"No tienes permisos para {action_desc}"
        )


def _check_action_permissions(action: dict, current_user: dict, action_desc: str = "ver esta acción") -> tuple[bool, bool, bool]:
    is_admin = current_user["active_role"] == settings.ROLE_ADMIN
    is_process_owner = current_user["id"] == action.get("created_by")
    is_action_leader = current_user["id"] == action.get("leader_id")
    
    if not (is_admin or is_process_owner or is_action_leader):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"No tienes permisos para {action_desc}"
        )
    return is_admin, is_process_owner, is_action_leader


def _build_update_data(**kwargs) -> dict:
    return {k: v for k, v in kwargs.items() if v is not None}


@router.get("/process/{process_id}", response_model=List[Action])
async def read_actions_by_process(
    process_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Get all actions for a specific process.
    """
    process = await get_process_by_id(process_id)
    if not process:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=PROCESS_NOT_FOUND
        )
    
    _check_process_permissions(process, current_user)
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
    if current_user["active_role"] != settings.ROLE_ADMIN and current_user["id"] != int(leader_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=NO_PERMISSION_VIEW_ACTIONS
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
    if process_id:
        process = await get_process_by_id(process_id)
        if not process:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=PROCESS_NOT_FOUND
            )
        _check_process_permissions(process, current_user, "ver estas estadísticas")
    
    statistics = await get_action_statistics(process_id)
    return statistics


@router.get("/upcoming-deadlines", response_model=List[Action])
async def read_upcoming_deadlines(
    limit: int = Query(5, ge=1, le=20),
    process_id: Optional[int] = None,
    date_range: str = Query("month", pattern="^(week|month|quarter|year)$"),
    current_user: dict = Depends(get_current_user),
):
    """
    Get actions with upcoming deadlines.
    """
    if process_id:
        process = await get_process_by_id(process_id)
        if not process:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=PROCESS_NOT_FOUND
            )
        _check_process_permissions(process, current_user)
    
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
            detail=ACTION_NOT_FOUND
        )
    
    _check_action_permissions(action, current_user)
    return action


@router.post("/", response_model=Action)
async def create_new_action(
    action_in: ActionCreate,
    current_user: dict = Depends(get_current_user),
):
    """
    Create new action.
    """
    process = await get_process_by_id(action_in.process_id)
    if not process:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=PROCESS_NOT_FOUND
        )
    
    if current_user["active_role"] == settings.ROLE_AUDITOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Los auditores no pueden crear acciones directamente."
        )

    _check_process_permissions(process, current_user, "crear acciones en este proceso")
    
    try:
        action = await create_action(action_in, current_user["id"])
        return action
    except Exception as e:
        logger.exception(f"Error creating action: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=GENERIC_ERROR_CREATE
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
    process = await get_process_by_id(process_id)
    if not process:
        raise HTTPException(
            status_code=404,
            detail=PROCESS_NOT_FOUND
        )
    
    _check_process_permissions(process, current_user, "crear acciones en este proceso")
    
    evidence_path = None
    if evidence:
        valid_types = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
        evidence_path = save_upload(
            evidence,
            folder="evidence",
            valid_types=valid_types,
            max_size=settings.MAX_UPLOAD_SIZE
        )
    
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
        if evidence_path:
            delete_file(evidence_path)
        logger.exception(f"Error creating action with evidence: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=GENERIC_ERROR_CREATE
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
    action = await get_action_by_id(action_id)
    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ACTION_NOT_FOUND
        )
    
    is_admin, is_process_owner, is_action_leader = _check_action_permissions(action, current_user, "actualizar esta acción")
    
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
    action = await get_action_by_id(action_id)
    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ACTION_NOT_FOUND
        )
    
    is_admin, is_process_owner, is_action_leader = _check_action_permissions(action, current_user, "actualizar esta acción")
    
    update_data = _build_update_data(
        name=name, leader_id=leader_id, origin=origin, start_date=start_date, target_date=target_date,
        completion_date=completion_date, what=what, why=why, how=how, where=where, status=status,
        completion_percentage=completion_percentage, related_type=related_type, related_id=related_id
    )
    
    if is_action_leader and not (is_admin or is_process_owner):
        allowed_fields = {"status", "completion_percentage", "evidence"}
        provided_fields = set(update_data.keys())
        if not provided_fields.issubset(allowed_fields):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo puedes actualizar el estado, porcentaje de completado y evidencias"
            )
    
    if evidence:
        if action.get("evidence"):
            delete_file(action["evidence"])
        
        valid_types = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
        evidence_path = save_upload(
            evidence,
            folder="evidence",
            valid_types=valid_types,
            max_size=settings.MAX_UPLOAD_SIZE
        )
        update_data["evidence"] = evidence_path
    
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
    action = await get_action_by_id(action_id)
    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ACTION_NOT_FOUND
        )
    
    if current_user["active_role"] != settings.ROLE_ADMIN and current_user["id"] != action.get("created_by"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar esta acción"
        )
    
    if action.get("evidence"):
        delete_file(action["evidence"])
    
    success = await delete_action(action_id)
    return {"success": success, "message": "Acción eliminada correctamente"}


@router.post("/{action_id}/files", response_model=dict)
async def upload_file_to_action(
    action_id: int,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Upload a file to an action.
    """
    action = await get_action_by_id(action_id)
    if not action:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=ACTION_NOT_FOUND)
    
    _check_action_permissions(action, current_user, "subir archivos a esta acción")
    
    try:
        resource = await add_resource_to_action(action_id, file, current_user["id"])
        return {"success": True, "data": resource, "message": "Archivo subido correctamente"}
    except Exception as e:
        logger.exception(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=GENERIC_ERROR_UPLOAD)


@router.get("/{action_id}/files", response_model=dict)
async def get_action_files(
    action_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Get all files for an action.
    """
    action = await get_action_by_id(action_id)
    if not action:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=ACTION_NOT_FOUND)
    
    _check_action_permissions(action, current_user, "ver los archivos de esta acción")
    
    files = await get_action_resources(action_id)
    return {"success": True, "data": files, "message": "Archivos obtenidos correctamente"}


@router.delete("/{action_id}/files/{file_id}", response_model=dict)
async def delete_action_file(
    action_id: int,
    file_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Delete a file from an action.
    """
    action = await get_action_by_id(action_id)
    if not action:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=ACTION_NOT_FOUND)
    
    _check_action_permissions(action, current_user, "eliminar archivos de esta acción")
    
    resource = await get_resource_by_id(file_id)
    if not resource or resource["action_id"] != action_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Archivo no encontrado")
    
    await delete_action_resource(file_id)
    return {"success": True, "message": "Archivo eliminado correctamente"}


@router.get("/{action_id}/files/{file_id}/download")
async def download_action_file(
    action_id: int,
    file_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Download a file from an action.
    """
    action = await get_action_by_id(action_id)
    if not action:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=ACTION_NOT_FOUND)
    
    _check_action_permissions(action, current_user, "descargar archivos de esta acción")
    
    resource = await get_resource_by_id(file_id)
    if not resource or resource["action_id"] != action_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Archivo no encontrado")
    
    from fastapi.responses import FileResponse
    return FileResponse(resource["file_path"], filename=resource["filename"], media_type=resource["content_type"])


@router.get("/{action_id}/files/{file_id}/preview")
async def preview_action_file(
    action_id: int,
    file_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Preview a file from an action.
    """
    action = await get_action_by_id(action_id)
    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ACTION_NOT_FOUND
        )
    
    _check_action_permissions(action, current_user, "previsualizar archivos de esta acción")
    
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Funcionalidad de vista previa de archivos en desarrollo"
    )
