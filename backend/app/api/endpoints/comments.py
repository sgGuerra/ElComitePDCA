from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.core.auth import get_current_user, settings
from app.models.comment import ProcessComments, ActionComments
from app.models.process import get_process_by_id
from app.models.action import get_action_by_id

router = APIRouter()

# ----------- Process Comments -----------

@router.get("/process/{process_id}", response_model=List[dict])
async def list_process_comments(process_id: int, current_user: dict = Depends(get_current_user)):
    process = await get_process_by_id(process_id)
    if not process:
        raise HTTPException(status_code=404, detail="Proceso no encontrado")
    
    # Permissions Check
    can_view_comments = False
    is_admin = settings.ROLE_ADMIN in current_user["roles"]
    is_creator = process["created_by"] == current_user["id"]
    is_auditor = settings.ROLE_AUDITOR in current_user["roles"]
    is_process_pending_audit = process.get("status") == "pending_audit"

    # TODO: Add check for assigned leader if that logic is implemented for processes

    if is_admin or is_creator:
        can_view_comments = True
    elif is_auditor and is_process_pending_audit:
        # Auditor can view comments if the process is pending audit
        can_view_comments = True
    
    if not can_view_comments:
        raise HTTPException(status_code=403, detail="No tienes permisos para ver los comentarios de este proceso")
    
    return await ProcessComments.get_comments(process_id)

@router.post("/process/{process_id}", response_model=dict)
async def add_process_comment(process_id: int, comment: str, current_user: dict = Depends(get_current_user)):
    process = await get_process_by_id(process_id)
    if not process:
        raise HTTPException(status_code=404, detail="Proceso no encontrado")

    # Permissions Check
    can_add_comment = False
    is_admin = settings.ROLE_ADMIN in current_user["roles"]
    is_creator = process["created_by"] == current_user["id"]
    is_auditor = settings.ROLE_AUDITOR in current_user["roles"]
    is_process_pending_audit = process.get("status") == "pending_audit"

    # TODO: Add check for assigned leader

    if is_admin or is_creator:
        can_add_comment = True
    elif is_auditor and is_process_pending_audit:
        # Auditor can add comments if the process is pending audit
        can_add_comment = True

    if not can_add_comment:
        raise HTTPException(status_code=403, detail="No tienes permisos para comentar en este proceso")
    
    return await ProcessComments.add_comment(process_id, current_user["id"], comment)

@router.delete("/process/comment/{comment_id}", response_model=dict)
async def delete_process_comment(comment_id: int, current_user: dict = Depends(get_current_user)):
    # Only the comment author or admin can delete
    success = await ProcessComments.delete_comment(comment_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=403, detail="No tienes permisos para eliminar este comentario")
    return {"success": True}

# ----------- Action Comments -----------

@router.get("/action/{action_id}", response_model=List[dict])
async def list_action_comments(action_id: int, current_user: dict = Depends(get_current_user)):
    action = await get_action_by_id(action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Acción no encontrada")
    is_admin = settings.ROLE_ADMIN in current_user["roles"]
    is_creator = action["created_by"] == current_user["id"]
    is_leader = action["leader_id"] == current_user["id"]
    if not (is_admin or is_creator or is_leader):
        raise HTTPException(status_code=403, detail="No tienes permisos para ver los comentarios de esta acción")
    return await ActionComments.get_comments(action_id)

@router.post("/action/{action_id}", response_model=dict)
async def add_action_comment(action_id: int, comment: str, current_user: dict = Depends(get_current_user)):
    action = await get_action_by_id(action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Acción no encontrada")
    is_admin = settings.ROLE_ADMIN in current_user["roles"]
    is_creator = action["created_by"] == current_user["id"]
    is_leader = action["leader_id"] == current_user["id"]
    if not (is_admin or is_creator or is_leader):
        raise HTTPException(status_code=403, detail="No tienes permisos para comentar en esta acción")
    return await ActionComments.add_comment(action_id, current_user["id"], comment)

@router.delete("/action/comment/{comment_id}", response_model=dict)
async def delete_action_comment(comment_id: int, current_user: dict = Depends(get_current_user)):
    # Only the comment author or admin can delete
    success = await ActionComments.delete_comment(comment_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=403, detail="No tienes permisos para eliminar este comentario")
    return {"success": True} 