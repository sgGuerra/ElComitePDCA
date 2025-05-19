#!/usr/bin/env python
import asyncio
import argparse
import bcrypt
import sys
import os

# Add the parent directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import get_one, insert


async def create_admin(name, email, password):
    """Create an admin user."""
    # Check if user already exists
    existing_user = await get_one("SELECT * FROM users WHERE email = ?", (email,))
    if existing_user:
        print(f"User with email {email} already exists")
        return False
    
    # Hash password
    hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    
    # Create admin user
    await insert(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        (name, email, hashed_password, "admin")
    )
    
    print(f"Admin user created: {email}")
    return True


def main():
    parser = argparse.ArgumentParser(description="Create admin user for El Comité PDCA")
    parser.add_argument("--name", required=True, help="Admin user name")
    parser.add_argument("--email", required=True, help="Admin user email")
    parser.add_argument("--password", required=True, help="Admin user password")
    
    args = parser.parse_args()
    
    asyncio.run(create_admin(args.name, args.email, args.password))


if __name__ == "__main__":
    main()
