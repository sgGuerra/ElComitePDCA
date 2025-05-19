import logging
import os
import time
from pathlib import Path

# Configure logging format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)

# Create logger instance
logger = logging.getLogger('elcomite')

# Function to create admin user from CLI
def create_admin_user(name, email, password):
    """
    Create an admin user.
    This function is intended to be called from the CLI.
    """
    # Import here to avoid circular imports
    import bcrypt
    from app.db.database import insert, get_one
    
    async def create_user():
        # Check if user already exists
        existing_user = await get_one("SELECT * FROM users WHERE email = ?", (email,))
        if existing_user:
            logger.error(f"User with email {email} already exists")
            return False
        
        # Hash password
        hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        
        # Create admin user
        await insert(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            (name, email, hashed_password, "admin")
        )
        
        logger.info(f"Admin user created: {email}")
        return True
    
    # Run the async function
    import asyncio
    return asyncio.run(create_user())
