from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional

from app.core.auth import get_current_user, verify_admin, verify_auditor, settings
from app.models.process import get_all_processes, get_process_by_id, update_process
from app.models.user import get_users_by_role
from app.models.notification import create_notification
from app.schemas.process import Process, ProcessUpdate
from app.schemas.audit import AuditReport, AuditReportCreate, AuditReportUpdate # Added AuditReportUpdate
from app.models.audit import (
    create_audit_report,
    get_audit_report_by_id,
    get_audit_reports,
    update_audit_report,
    delete_audit_report
)

router = APIRouter()

@router.post("/processes/{process_id}/request-audit", response_model=Process)
async def request_process_audit(
    process_id: int,
    current_user: dict = Depends(verify_admin) # Only admin can request an audit
):
    """Admin requests an audit for a specific process."""
    process = await get_process_by_id(process_id)
    if not process:
        raise HTTPException(status_code=404, detail="Proceso no encontrado")

    updated_process_data = ProcessUpdate(status="pending_audit")
    updated_process = await update_process(process_id, updated_process_data)

    if not updated_process:
        raise HTTPException(status_code=500, detail="No se pudo actualizar el estado del proceso")

    # Notify all auditors
    auditors = await get_users_by_role(settings.ROLE_AUDITOR)
    for auditor in auditors:
        await create_notification(
            user_id=auditor["id"],
            title="Solicitud de Auditoría de Proceso",
            message=f"El proceso '{process['name']}' ha sido enviado para auditoría.",
            related_type="process",
            related_id=process_id
        )
    return updated_process

@router.get("/processes-for-review", response_model=List[Process])
async def list_processes_for_auditor_review(
    current_user: dict = Depends(verify_auditor) # Only auditors can see processes for review
):
    """Auditor lists all processes marked as 'pending_audit'."""
    # In a more complex system, this would filter by processes assigned to the specific auditor.
    # For now, all auditors see all processes pending audit.
    processes = await get_all_processes(status_filter="pending_audit")
    return processes

# --- Audit Report Endpoints ---

@router.post("/reports", response_model=AuditReport)
async def create_new_audit_report(
    report_in: AuditReportCreate,
    current_user: dict = Depends(verify_auditor)
):
    """Auditor creates a new audit report."""
    report = await create_audit_report(
        **report_in.model_dump(), 
        auditor_id=current_user["id"]
    )
    return report

@router.get("/reports", response_model=List[AuditReport])
async def list_audit_reports(
    process_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Lists audit reports. 
       - Auditors see their own reports. 
       - Admins see all reports.
    """
    auditor_id_filter = None
    if settings.ROLE_AUDITOR in current_user["roles"] and settings.ROLE_ADMIN not in current_user["roles"]:
        # Auditor sees only their reports unless they are also an admin
        auditor_id_filter = current_user["id"]
    
    reports = await get_audit_reports(process_id=process_id, auditor_id=auditor_id_filter)
    return reports

@router.get("/reports/{report_id}", response_model=AuditReport)
async def get_single_audit_report(
    report_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Gets a single audit report. 
       - Auditors can get their own reports. 
       - Admins can get any report.
    """
    report = await get_audit_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Informe de auditoría no encontrado")

    is_admin = settings.ROLE_ADMIN in current_user["roles"]
    is_report_author = report["auditor_id"] == current_user["id"]

    if not (is_admin or (settings.ROLE_AUDITOR in current_user["roles"] and is_report_author)):
        raise HTTPException(status_code=403, detail="No tienes permisos para ver este informe")
    
    return report

@router.put("/reports/{report_id}", response_model=AuditReport)
async def update_existing_audit_report(
    report_id: int,
    report_in: AuditReportUpdate,
    current_user: dict = Depends(verify_auditor) # Only auditors can update reports
):
    """Auditor updates their own audit report. Only draft reports can be fully updated.
       Once submitted, status changes might be restricted.
    """
    existing_report = await get_audit_report_by_id(report_id)
    if not existing_report:
        raise HTTPException(status_code=404, detail="Informe de auditoría no encontrado")
    
    if existing_report["auditor_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para actualizar este informe")

    # Add logic here if certain statuses prevent updates, e.g.:
    # if existing_report["status"] != "draft":
    #     raise HTTPException(status_code=400, detail="Solo los informes en borrador pueden ser modificados completamente.")

    updated_report = await update_audit_report(report_id, **report_in.model_dump(exclude_unset=True))
    if not updated_report:
        # This case should ideally be handled by update_audit_report raising an error if not found
        raise HTTPException(status_code=404, detail="No se pudo actualizar el informe") 
    return updated_report

@router.delete("/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_audit_report(
    report_id: int,
    current_user: dict = Depends(get_current_user) # Admin or auditor who authored it
):
    """Deletes an audit report. Only admin or the authoring auditor can delete."""
    report = await get_audit_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Informe de auditoría no encontrado")

    is_admin = settings.ROLE_ADMIN in current_user["roles"]
    is_report_author = report["auditor_id"] == current_user["id"]

    if not (is_admin or (settings.ROLE_AUDITOR in current_user["roles"] and is_report_author)):
        raise HTTPException(status_code=403, detail="No tienes permisos para eliminar este informe")

    # TODO: Consider deleting the associated file if file_path exists and is managed by the app
    # from app.middleware.upload import delete_file
    # if report.get("file_path"):
    #     delete_file(report["file_path"])

    await delete_audit_report(report_id)
    return

# Placeholder for PDF download - actual PDF generation/serving is more complex
@router.get("/reports/{report_id}/download")
async def download_audit_report_pdf(
    report_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Allows download of the audit report PDF if available."""
    report = await get_audit_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Informe de auditoría no encontrado")

    is_admin = settings.ROLE_ADMIN in current_user["roles"]
    is_report_author = report["auditor_id"] == current_user["id"]

    if not (is_admin or (settings.ROLE_AUDITOR in current_user["roles"] and is_report_author)):
        raise HTTPException(status_code=403, detail="No tienes permisos para descargar este informe")

    if not report.get("file_path"):
        raise HTTPException(status_code=404, detail="No hay archivo PDF disponible para este informe")

    # This assumes file_path is a direct path to the file accessible by the server
    # For robust production systems, consider secure file serving (e.g., FileResponse)
    # from fastapi.responses import FileResponse
    # return FileResponse(report["file_path"], filename=f"audit_report_{report_id}.pdf")
    
    return {"message": "Download functionality for PDF reports is under development.", "file_path": report["file_path"]} 