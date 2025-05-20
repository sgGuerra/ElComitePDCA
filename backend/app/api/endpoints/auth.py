from fastapi import APIRouter, Depends, HTTPException, status, Form, Body
from fastapi.security import OAuth2PasswordRequestForm

from app.core.auth import create_access_token, get_current_user
from app.models.user import validate_credentials, get_user_by_id
from app.schemas.token import Token
from app.schemas.user import User, UserCreate, UserUpdate

router = APIRouter()


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = await validate_credentials(form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Set active role to first role in list
    active_role = user["roles"][0] if user["roles"] else "process_leader"
    
    # Create access token with user info
    token = create_access_token(
        subject=user["id"],
        extra_data={
            "email": user["email"],
            "roles": user["roles"],
            "active_role": active_role,
            "name": user["name"]
        }
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user["id"],
        "user_roles": user["roles"],
        "active_role": active_role
    }


@router.post("/token", response_model=Token)
async def login_with_form(
    username: str = Form(...),
    password: str = Form(...),
):
    """
    Form based login for OAuth2 compatibility (used by Swagger UI)
    """
    user = await validate_credentials(username, password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Set active role to first role in list
    active_role = user["roles"][0] if user["roles"] else "process_leader"
    
    # Create access token with user info
    token = create_access_token(
        subject=user["id"],
        extra_data={
            "email": user["email"],
            "roles": user["roles"],
            "active_role": active_role,
            "name": user["name"]
        }
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user["id"],
        "user_roles": user["roles"],
        "active_role": active_role
    }


@router.get("/me", response_model=User)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    Get current user information
    """
    return current_user


@router.post("/switch-role", response_model=Token)
async def switch_user_role(
    role: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user)
):
    """
    Switch the active role for the current user
    """
    # Check if user has the requested role
    if role not in current_user["roles"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User does not have the {role} role"
        )
    
    # Create new token with updated active role
    token = create_access_token(
        subject=current_user["id"],
        extra_data={
            "email": current_user["email"],
            "roles": current_user["roles"],
            "active_role": role,
            "name": current_user["name"]
        }
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": current_user["id"],
        "user_roles": current_user["roles"],
        "active_role": role
    }
