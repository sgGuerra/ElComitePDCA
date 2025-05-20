import logging
import bcrypt
from typing import Optional, List, Dict, Any
from datetime import datetime

from app.db.database import get_one, get_all, insert, execute
from app.schemas.user import UserCreate, UserUpdate

logger = logging.getLogger(__name__)


async def create_user(user_data: UserCreate) -> Dict[str, Any]:
    """Create a new user."""
    try:
        # Check if email already exists
        existing_user = await get_one("SELECT * FROM users WHERE email = ?", (user_data.email,))
        if existing_user:
            raise ValueError(f"User with email {user_data.email} already exists")
        
        # Hash password
        hashed_password = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt()).decode()
        
        # Convert roles list to comma-separated string
        roles = ','.join(user_data.roles)
        
        # Insert user into database
        user_id = await insert(
            "INSERT INTO users (name, email, password, roles) VALUES (?, ?, ?, ?)",
            (user_data.name, user_data.email, hashed_password, roles)
        )
        
        # Return the created user
        return await get_user_by_id(user_id)
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise


async def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """Get user by ID."""
    try:
        user = await get_one("SELECT * FROM users WHERE id = ?", (user_id,))
        
        if user:
            # Convert roles from string to list
            user["roles"] = user["roles"].split(',')
        
        return user
    except Exception as e:
        logger.error(f"Error getting user: {e}")
        raise


async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email."""
    try:
        user = await get_one("SELECT * FROM users WHERE email = ?", (email,))
        
        if user:
            # Convert roles from string to list
            user["roles"] = user["roles"].split(',')
        
        return user
    except Exception as e:
        logger.error(f"Error getting user by email: {e}")
        raise


async def get_all_users() -> List[Dict[str, Any]]:
    """Get all users."""
    try:
        users = await get_all("SELECT * FROM users")
        
        # Convert roles from string to list for each user
        for user in users:
            user["roles"] = user["roles"].split(',')
        
        return users
    except Exception as e:
        logger.error(f"Error getting all users: {e}")
        raise


async def update_user(user_id: int, user_data: UserUpdate) -> Optional[Dict[str, Any]]:
    """Update user information."""
    try:
        # Check if user exists
        user = await get_user_by_id(user_id)
        if not user:
            return None
        
        # Build update query dynamically
        update_fields = []
        params = []
        
        if user_data.name is not None:
            update_fields.append("name = ?")
            params.append(user_data.name)
        
        if user_data.email is not None:
            # Check if email already exists for another user
            existing_user = await get_one("SELECT * FROM users WHERE email = ? AND id != ?", (user_data.email, user_id))
            if existing_user:
                raise ValueError(f"Email {user_data.email} is already in use")
            
            update_fields.append("email = ?")
            params.append(user_data.email)
        
        if user_data.password is not None:
            hashed_password = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt()).decode()
            update_fields.append("password = ?")
            params.append(hashed_password)
        
        if user_data.roles is not None:
            roles = ','.join(user_data.roles)
            update_fields.append("roles = ?")
            params.append(roles)
        
        if user_data.is_active is not None:
            update_fields.append("is_active = ?")
            params.append(1 if user_data.is_active else 0)
        
        if not update_fields:
            return user
        
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        
        # Execute update
        query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = ?"
        params.append(user_id)
        
        await execute(query, tuple(params))
        
        # Return updated user
        return await get_user_by_id(user_id)
    except Exception as e:
        logger.error(f"Error updating user: {e}")
        raise


async def delete_user(user_id: int) -> bool:
    """Delete a user."""
    try:
        # Check if user exists
        user = await get_user_by_id(user_id)
        if not user:
            return False
        
        # Delete user
        await execute("DELETE FROM users WHERE id = ?", (user_id,))
        return True
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        raise


async def validate_credentials(email: str, password: str) -> Optional[Dict[str, Any]]:
    """Validate user credentials."""
    try:
        user = await get_user_by_email(email)
        
        if not user:
            return None
        
        # Check if user is active
        if not user.get("is_active", True):
            return None
        
        # Verify password
        if bcrypt.checkpw(password.encode(), user["password"].encode()):
            return user
        
        return None
    except Exception as e:
        logger.error(f"Error validating credentials: {e}")
        raise


async def get_users_by_role(role: str) -> List[Dict[str, Any]]:
    """Get users with a specific role."""
    try:
        # We use LIKE here since roles are stored as comma-separated values
        users = await get_all(
            "SELECT * FROM users WHERE roles LIKE ? AND is_active = 1",
            (f"%{role}%",)
        )
        
        # Convert roles from string to list for each user
        for user in users:
            user["roles"] = user["roles"].split(',')
        
        return users
    except Exception as e:
        logger.error(f"Error getting users by role: {e}")
        raise
