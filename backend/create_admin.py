import asyncio
import bcrypt
import aiosqlite
import os

async def create_admin():
    # Use the SAME path the backend uses: ../database.sqlite (relative to backend/)
    db_path = os.path.join(os.path.dirname(__file__), "..", "database.sqlite")
    db_path = os.path.abspath(db_path)
    
    email = "admin@elcomite.org"
    password = "Admin123!"
    name = "Administrador PDCA"
    roles = "admin,process_leader"
    
    print(f"Using database at: {db_path}")
    print(f"Database exists: {os.path.exists(db_path)}")
    
    hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    
    async with aiosqlite.connect(db_path) as conn:
        # Check if admin email already exists
        cursor = await conn.execute("SELECT id, email, roles FROM users WHERE email = ?", (email,))
        existing = await cursor.fetchone()
        
        if existing:
            print(f"User with email {email} already exists (id={existing[0]}). Updating password and roles...")
            await conn.execute(
                "UPDATE users SET password = ?, roles = ?, name = ? WHERE email = ?",
                (hashed_password, roles, name, email)
            )
        else:
            # Also update miguel@elcomite.org to have admin role and known password
            cursor2 = await conn.execute("SELECT id, email, roles FROM users WHERE email = ?", ("miguel@elcomite.org",))
            miguel = await cursor2.fetchone()
            if miguel:
                print(f"Found existing admin user miguel@elcomite.org (id={miguel[0]}). Updating password to known value...")
                await conn.execute(
                    "UPDATE users SET password = ?, roles = ? WHERE email = ?",
                    (hashed_password, "admin,process_leader", "miguel@elcomite.org")
                )
                await conn.commit()
                print(f"\nAdmin user updated!")
                print(f"Email: miguel@elcomite.org")
                print(f"Password: {password}")
                return
            
            await conn.execute(
                "INSERT INTO users (name, email, password, roles) VALUES (?, ?, ?, ?)",
                (name, email, hashed_password, roles)
            )
        
        await conn.commit()
        print(f"\nAdmin user ready!")
        print(f"Email: {email}")
        print(f"Password: {password}")

        # List all users
        cursor3 = await conn.execute("SELECT id, name, email, roles FROM users")
        all_users = await cursor3.fetchall()
        print(f"\nAll users in database:")
        for u in all_users:
            print(f"  id={u[0]}, name={u[1]}, email={u[2]}, roles={u[3]}")

if __name__ == "__main__":
    asyncio.run(create_admin())
