from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union

from jose import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import ValidationError

from app.core.config import settings
from app.schemas.token import TokenPayload
from app.models.user import get_user_by_id

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def create_access_token(subject: Union[str, int], extra_data: Dict[str, Any] = None) -> str:
    """
    Create JWT access token
    
    Args:
        subject: Token subject (usually user ID)
        extra_data: Additional data to include in token
        
    Returns:
        JWT token string
    """
    to_encode = {}
    
    # Set token expiration
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "sub": str(subject)})
    
    # Add extra data if provided
    if extra_data:
        # Ensure roles is a list
        if 'roles' in extra_data and isinstance(extra_data['roles'], str):
            extra_data['roles'] = extra_data['roles'].split(',')
        to_encode.update(extra_data)
    
    # Create JWT token
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Validate and decode JWT token to get current user
    
    Args:
        token: JWT token
        
    Returns:
        User object
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        token_data = TokenPayload(**payload)
        
        if datetime.fromtimestamp(token_data.exp) < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token payload: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    user = await get_user_by_id(int(token_data.sub))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user is active
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Add active role from token if it exists
    if hasattr(token_data, 'active_role') and token_data.active_role:
        user["active_role"] = token_data.active_role
    else:
        # Default to first role in user's roles
        user["active_role"] = user["roles"][0] if user["roles"] else settings.ROLE_PROCESS_LEADER
    
    return user


def verify_role(required_roles: List[str]):
    """
    Dependency to verify user has one of the required roles
    
    Args:
        required_roles: List of roles that are allowed to access the endpoint
        
    Returns:
        Dependency function
    """
    async def verify_user_role(current_user: dict = Depends(get_current_user)):
        # First check that user has the role in their assigned roles
        has_required_role = False
        for role in required_roles:
            if role in current_user["roles"]:
                has_required_role = True
                break
        
        if not has_required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes el rol requerido para esta acción"
            )
        
        # Then check that their active role matches one of the required roles
        # This ensures they're operating in the correct view
        if current_user["active_role"] not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Debes cambiar al rol {'admin' if settings.ROLE_ADMIN in required_roles else 'asignado'} para realizar esta acción"
            )
        
        return current_user
    
    return verify_user_role


# Shortcut dependencies for common role checks
verify_admin = verify_role([settings.ROLE_ADMIN])
verify_process_leader = verify_role([settings.ROLE_PROCESS_LEADER])
verify_auditor = verify_role([settings.ROLE_AUDITOR])
verify_admin_or_leader = verify_role([settings.ROLE_ADMIN, settings.ROLE_PROCESS_LEADER])
verify_any_role = verify_role([settings.ROLE_ADMIN, settings.ROLE_PROCESS_LEADER, settings.ROLE_AUDITOR])
