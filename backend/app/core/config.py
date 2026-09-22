import os
import secrets
from typing import Any, Dict, List, Optional, Union

from pydantic import AnyHttpUrl, PostgresDsn, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "El Comité PDCA"
    
    # API settings
    API_V1_STR: str = ""
    
    # Security settings
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "el-comite-pdca-secret-key-change-in-production-2024")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    # CORS settings
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    # Database settings
    DATABASE_URL: str = f"sqlite:///../database.sqlite"
    
    # Roles
    ROLE_ADMIN: str = "admin"
    ROLE_PROCESS_LEADER: str = "process_leader"
    ROLE_AUDITOR: str = "auditor"
    
    # File upload settings
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10 MB
    
    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
