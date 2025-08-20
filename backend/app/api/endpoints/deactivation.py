from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user
from app.core.config import settings
from app.models.deactivation import (
    create_deactivation_request,
    get_deactivation_requests,
    get_deactivation_request_by_id,
    process_deactivation_request
)
from app.models.process import get_processes_by_leader
from app.schemas.deactivation import (
    DeactivationRequestCreate,
    DeactivationRequest,
    DeactivationRequestProcess,
    DeactivationRequestWithProcesses
)

router = APIRouter()


@router.post("/request-deactivation", response_model=DeactivationRequest)
async def request_account_deactivation(
    request_in: DeactivationRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Request account deactivation.
    Users can request to have their account deactivated.
    """
    try:
        request = await create_deactivation_request(
            user_id=current_user["id"],
            reason=request_in.reason
        )
        return request
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/deactivation-requests", response_model=List[DeactivationRequest])
async def get_account_deactivation_requests(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all deactivation requests.
    Only admin users can access this endpoint.
    """
    if current_user["role"] != settings.ROLE_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver las solicitudes de desactivación"
        )
    
    try:
        requests = await get_deactivation_requests(status=status)
        return requests
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/deactivation-requests/{request_id}", response_model=DeactivationRequestWithProcesses)
async def get_deactivation_request_details(
    request_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed information about a deactivation request.
    Only admin users can access this endpoint.
    """
    if current_user["role"] != settings.ROLE_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver los detalles de la solicitud"
        )
    
    try:
        # Get the deactivation request
        request = await get_deactivation_request_by_id(request_id)
        
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Solicitud no encontrada"
            )
        
        # Get processes led by the user
        processes = await get_processes_by_leader(request["user_id"])
        
        # Combine the data
        request_with_processes = {**request, "led_processes": processes}
        
        return request_with_processes
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/deactivation-requests/{request_id}/process", response_model=DeactivationRequest)
async def process_account_deactivation_request(
    request_id: int,
    process_data: DeactivationRequestProcess,
    current_user: dict = Depends(get_current_user)
):
    """
    Process a deactivation request.
    Only admin users can process deactivation requests.
    """
    if current_user["role"] != settings.ROLE_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para procesar solicitudes de desactivación"
        )
    
    try:
        # Process the request
        processed_request = await process_deactivation_request(
            request_id=request_id,
            processor_id=current_user["id"],
            approve=process_data.approve
        )
        
        if not processed_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Solicitud no encontrada"
            )
        
        # If we're approving and there's a new leader ID, handle process reassignment
        if process_data.approve and process_data.new_leader_id:
            # Note: This would typically call a function to reassign processes
            # You'll need to implement this function in the process model
            # await reassign_processes(request["user_id"], process_data.new_leader_id)
            pass
        
        return processed_request
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
