import asyncio
import bcrypt
import aiosqlite
import os

async def create_admin():
    db_path = "database.sqlite"
    email = "admin@example.com"
    password = "adminpassword123"
    name = "Administrador Principal"
    roles = "admin,process_leader"
    
    hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    
    async with aiosqlite.connect(db_path) as conn:
        # Check if exists
        cursor = await conn.execute("SELECT * FROM users WHERE email = ?", (email,))
        if await cursor.fetchone():
            print("El administrador ya existe.")
            return
            
        await conn.execute(
            "INSERT INTO users (name, email, password, roles) VALUES (?, ?, ?, ?)",
            (name, email, hashed_password, roles)
        )
        await conn.commit()
        print(f"Administrador creado exitosamente!")
        print(f"Email: {email}")
        print(f"Contraseña: {password}")

if __name__ == "__main__":
    asyncio.run(create_admin())
