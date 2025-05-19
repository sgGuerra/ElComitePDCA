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
            raise ValueError("User with this email already exists")
        
        # Hash password
        hashed_password = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt()).decode()
        
        # Insert user into database
        user_id = await insert(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            (user_data.name, user_data.email, hashed_password, user_data.role)
        )
        
        # Return created user (without password)
        return {
            "id": user_id,
            "name": user_data.name,
            "email": user_data.email,
            "role": user_data.role,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        raise


async def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """Get user by ID."""
    try:
        user = await get_one(
            "SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?",
            (user_id,)
        )
        return user
    except Exception as e:
        logger.error(f"Error getting user by ID: {str(e)}")
        return None


async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email."""
    try:
        user = await get_one("SELECT * FROM users WHERE email = ?", (email,))
        return user
    except Exception as e:
        logger.error(f"Error getting user by email: {str(e)}")
        return None


async def get_all_users() -> List[Dict[str, Any]]:
    """Get all users."""
    try:
        users = await get_all(
            "SELECT id, name, email, role, created_at, updated_at FROM users"
        )
        return users
    except Exception as e:
        logger.error(f"Error getting all users: {str(e)}")
        return []


async def update_user(user_id: int, user_data: UserUpdate) -> Optional[Dict[str, Any]]:
    """Update user information."""
    try:
        # Get existing user
        existing_user = await get_user_by_id(user_id)
        if not existing_user:
            return None
        
        # Prepare update fields
        update_fields = {}
        if user_data.name is not None:
            update_fields["name"] = user_data.name
        if user_data.email is not None:
            update_fields["email"] = user_data.email
        if user_data.role is not None:
            update_fields["role"] = user_data.role
        if user_data.password is not None:
            update_fields["password"] = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt()).decode()
        
        if not update_fields:
            return existing_user
        
        # Create SET part of SQL query
        set_clause = ", ".join([f"{field} = ?" for field in update_fields.keys()])
        set_clause += ", updated_at = datetime('now')"
        
        # Execute update
        await execute(
            f"UPDATE users SET {set_clause} WHERE id = ?",
            (*update_fields.values(), user_id)
        )
        
        # Return updated user
        return await get_user_by_id(user_id)
    except Exception as e:
        logger.error(f"Error updating user: {str(e)}")
        return None


async def delete_user(user_id: int) -> bool:
    """Delete a user."""
    try:
        # Check if user exists
        existing_user = await get_user_by_id(user_id)
        if not existing_user:
            return False
        
        # Delete user
        await execute("DELETE FROM users WHERE id = ?", (user_id,))
        return True
    except Exception as e:
        logger.error(f"Error deleting user: {str(e)}")
        return False


async def validate_credentials(email: str, password: str) -> Optional[Dict[str, Any]]:
    """Validate user credentials."""
    try:
        user = await get_one("SELECT * FROM users WHERE email = ?", (email,))
        
        if not user:
            return None
        
        # Verify password
        if bcrypt.checkpw(password.encode(), user["password"].encode()):
            return {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"]
            }
        
        return None
    except Exception as e:
        logger.error(f"Error validating credentials: {str(e)}")
        return None
