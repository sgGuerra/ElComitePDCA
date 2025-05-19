import logging
import aiosqlite
import os
import bcrypt
from app.core.config import settings

logger = logging.getLogger(__name__)

# Define SQL statements for creating tables
CREATE_USERS_TABLE = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'process_leader',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

CREATE_PROCESSES_TABLE = """
CREATE TABLE IF NOT EXISTS processes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id)
);
"""

CREATE_OPPORTUNITIES_TABLE = """
CREATE TABLE IF NOT EXISTS opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    process_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open',
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (process_id) REFERENCES processes (id),
    FOREIGN KEY (created_by) REFERENCES users (id)
);
"""

CREATE_FINDINGS_TABLE = """
CREATE TABLE IF NOT EXISTS findings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    process_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open',
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (process_id) REFERENCES processes (id),
    FOREIGN KEY (created_by) REFERENCES users (id)
);
"""

CREATE_ACTIONS_TABLE = """
CREATE TABLE IF NOT EXISTS actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    process_id INTEGER NOT NULL,
    leader_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    origin TEXT,
    start_date DATE,
    target_date DATE,
    completion_date DATE,
    what TEXT,
    why TEXT,
    how TEXT,
    location TEXT,
    status TEXT DEFAULT 'pending',
    evidence TEXT,
    completion_percentage INTEGER DEFAULT 0,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    related_type TEXT,
    related_id INTEGER,
    FOREIGN KEY (process_id) REFERENCES processes (id),
    FOREIGN KEY (leader_id) REFERENCES users (id),
    FOREIGN KEY (created_by) REFERENCES users (id)
);
"""

CREATE_NOTIFICATIONS_TABLE = """
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT 0,
    related_type TEXT,
    related_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
"""

async def init_db():
    """Initialize the database with tables."""
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    db_exists = os.path.exists(db_path)
    
    async with aiosqlite.connect(db_path) as conn:
        # Create tables
        await conn.execute(CREATE_USERS_TABLE)
        await conn.execute(CREATE_PROCESSES_TABLE)
        await conn.execute(CREATE_OPPORTUNITIES_TABLE)
        await conn.execute(CREATE_FINDINGS_TABLE)
        await conn.execute(CREATE_ACTIONS_TABLE)
        await conn.execute(CREATE_NOTIFICATIONS_TABLE)
        
        # Create indices for frequently accessed columns
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_actions_process_id ON actions (process_id)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_actions_leader_id ON actions (leader_id)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_actions_status ON actions (status)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications (read)")
        
        await conn.commit()
        
        # Create default admin user if database is new
        if not db_exists:
            hashed_password = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode()
            
            await conn.execute(
                "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                ("Admin", "admin@example.com", hashed_password, settings.ROLE_ADMIN)
            )
            await conn.commit()
            logger.info("Created default admin user: admin@example.com / admin123")
    
    logger.info("Database initialized successfully")
