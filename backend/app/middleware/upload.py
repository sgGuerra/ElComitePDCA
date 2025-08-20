import os
import uuid
from typing import Callable, List, Optional
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


def save_upload(
    upload_file: UploadFile,
    folder: str = "",
    valid_types: List[str] = None,
    max_size: Optional[int] = None
) -> str:
    """
    Save an uploaded file with validation
    
    Args:
        upload_file: The uploaded file
        folder: Subfolder within uploads directory
        valid_types: List of valid MIME types
        max_size: Maximum file size in bytes
        
    Returns:
        Path to saved file relative to uploads directory
    """
    # Validate file type if specified
    if valid_types and upload_file.content_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de archivo no válido. Tipos permitidos: {', '.join(valid_types)}"
        )
    
    # Create unique filename to prevent collisions
    file_extension = os.path.splitext(upload_file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    # Create target directory if it doesn't exist
    target_folder = os.path.join(settings.UPLOAD_DIR, folder)
    os.makedirs(target_folder, exist_ok=True)
    
    # Full path to save the file
    file_path = os.path.join(target_folder, unique_filename)
    
    try:
        # Read file content
        file_content = upload_file.file.read()
        
        # Validate file size if specified
        if max_size and len(file_content) > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Archivo demasiado grande. Tamaño máximo: {max_size / (1024 * 1024):.1f} MB"
            )
        
        # Write file to disk
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # Return the path relative to uploads directory
        relative_path = os.path.join(folder, unique_filename) if folder else unique_filename
        return relative_path
    
    except Exception as e:
        # Clean up if something went wrong
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar el archivo: {str(e)}"
        )
    finally:
        # Close the file
        upload_file.file.close()


def delete_file(file_path: str) -> bool:
    """
    Delete a file from the uploads directory
    
    Args:
        file_path: Path to file relative to uploads directory
        
    Returns:
        True if file was deleted, False otherwise
    """
    try:
        full_path = os.path.join(settings.UPLOAD_DIR, file_path)
        if os.path.exists(full_path):
            os.remove(full_path)
            return True
        return False
    except Exception:
        return False
