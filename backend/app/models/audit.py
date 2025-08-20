import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.db.database import get_one, get_all, insert, execute
from app.core.config import settings

logger = logging.getLogger(__name__)


async def create_audit_report(
    title: str,
    content: str,
    auditor_id: int,
    process_id: Optional[int] = None,
    file_path: Optional[str] = None,
    status: str = "draft"
) -> Dict[str, Any]:
    """Create a new audit report."""
    try:
        report_id = await insert(
            """
            INSERT INTO audit_reports (
                title, content, process_id, auditor_id, file_path, status
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (title, content, process_id, auditor_id, file_path, status)
        )
        
        # Get the inserted report with related information
        report = await get_one(
            """
            SELECT ar.*, u.name as auditor_name,
                   p.name as process_name
            FROM audit_reports ar
            JOIN users u ON ar.auditor_id = u.id
            LEFT JOIN processes p ON ar.process_id = p.id
            WHERE ar.id = ?
            """,
            (report_id,)
        )
        
        return report
    except Exception as e:
        logger.error(f"Error creating audit report: {e}")
        raise


async def get_audit_report_by_id(report_id: int) -> Optional[Dict[str, Any]]:
    """Get audit report by ID."""
    try:
        report = await get_one(
            """
            SELECT ar.*, u.name as auditor_name,
                   p.name as process_name
            FROM audit_reports ar
            JOIN users u ON ar.auditor_id = u.id
            LEFT JOIN processes p ON ar.process_id = p.id
            WHERE ar.id = ?
            """,
            (report_id,)
        )
        
        return report
    except Exception as e:
        logger.error(f"Error getting audit report by ID: {e}")
        raise


async def get_audit_reports(
    process_id: Optional[int] = None,
    auditor_id: Optional[int] = None,
    status: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Get audit reports with optional filtering."""
    try:
        query = """
            SELECT ar.*, u.name as auditor_name,
                   p.name as process_name
            FROM audit_reports ar
            JOIN users u ON ar.auditor_id = u.id
            LEFT JOIN processes p ON ar.process_id = p.id
            WHERE 1=1
        """
        params = []
        
        if process_id is not None:
            query += " AND ar.process_id = ?"
            params.append(process_id)
        
        if auditor_id is not None:
            query += " AND ar.auditor_id = ?"
            params.append(auditor_id)
        
        if status is not None:
            query += " AND ar.status = ?"
            params.append(status)
        
        query += " ORDER BY ar.created_at DESC"
        
        reports = await get_all(query, tuple(params))
        
        return reports
    except Exception as e:
        logger.error(f"Error getting audit reports: {e}")
        raise


async def update_audit_report(
    report_id: int,
    title: Optional[str] = None,
    content: Optional[str] = None,
    file_path: Optional[str] = None,
    status: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """Update an audit report."""
    try:
        # Build update query dynamically
        update_fields = []
        params = []
        
        if title is not None:
            update_fields.append("title = ?")
            params.append(title)
        
        if content is not None:
            update_fields.append("content = ?")
            params.append(content)
        
        if file_path is not None:
            update_fields.append("file_path = ?")
            params.append(file_path)
        
        if status is not None:
            update_fields.append("status = ?")
            params.append(status)
        
        if not update_fields:
            return await get_audit_report_by_id(report_id)
        
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        
        # Execute update
        query = f"UPDATE audit_reports SET {', '.join(update_fields)} WHERE id = ?"
        params.append(report_id)
        
        await execute(query, tuple(params))
        
        # Get updated report
        return await get_audit_report_by_id(report_id)
    except Exception as e:
        logger.error(f"Error updating audit report: {e}")
        raise


async def delete_audit_report(report_id: int) -> bool:
    """Delete an audit report."""
    try:
        await execute(
            "DELETE FROM audit_reports WHERE id = ?",
            (report_id,)
        )
        return True
    except Exception as e:
        logger.error(f"Error deleting audit report: {e}")
        raise
