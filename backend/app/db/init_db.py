import logging
import os
import sqlite3
import aiosqlite

from app.core.config import settings

logger = logging.getLogger(__name__)

# Define SQL statements for creating tables
CREATE_USERS_TABLE = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    roles TEXT NOT NULL DEFAULT 'process_leader',
    is_active BOOLEAN NOT NULL DEFAULT 1,
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
    owner TEXT,
    leader_id INTEGER,
    priority TEXT DEFAULT 'medium',
    departmentId TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id),
    FOREIGN KEY (leader_id) REFERENCES users (id)
);
"""

CREATE_PROCESS_LEADERS_TABLE = """
CREATE TABLE IF NOT EXISTS process_leaders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    process_id INTEGER NOT NULL,
    leader_id INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (process_id) REFERENCES processes (id),
    FOREIGN KEY (leader_id) REFERENCES users (id),
    FOREIGN KEY (created_by) REFERENCES users (id),
    UNIQUE(process_id, leader_id)
);
"""

CREATE_PROCESS_COMMENTS_TABLE = """
CREATE TABLE IF NOT EXISTS process_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    process_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (process_id) REFERENCES processes (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
);
"""

CREATE_ACTIONS_TABLE = """
CREATE TABLE IF NOT EXISTS actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    process_id INTEGER NOT NULL,
    leader_id INTEGER NOT NULL,
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
    related_type TEXT,
    related_id INTEGER,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (process_id) REFERENCES processes (id),
    FOREIGN KEY (leader_id) REFERENCES users (id),
    FOREIGN KEY (created_by) REFERENCES users (id)
);
"""

CREATE_ACTION_COMMENTS_TABLE = """
CREATE TABLE IF NOT EXISTS action_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (action_id) REFERENCES actions (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
);
"""

CREATE_ACTION_RESOURCES_TABLE = """
CREATE TABLE IF NOT EXISTS action_resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    content_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (action_id) REFERENCES actions (id),
    FOREIGN KEY (uploaded_by) REFERENCES users (id)
);
"""

CREATE_NOTIFICATIONS_TABLE = """
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT 0,
    related_type TEXT,
    related_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
"""

CREATE_USER_DEACTIVATION_REQUESTS_TABLE = """
CREATE TABLE IF NOT EXISTS user_deactivation_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processed_by INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (processed_by) REFERENCES users (id)
);
"""

CREATE_AUDIT_REPORTS_TABLE = """
CREATE TABLE IF NOT EXISTS audit_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    process_id INTEGER,
    auditor_id INTEGER NOT NULL,
    file_path TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (process_id) REFERENCES processes (id),
    FOREIGN KEY (auditor_id) REFERENCES users (id)
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

# List of all create table statements
CREATE_TABLES = [
    CREATE_USERS_TABLE,
    CREATE_PROCESSES_TABLE,
    CREATE_PROCESS_LEADERS_TABLE,
    CREATE_PROCESS_COMMENTS_TABLE,
    CREATE_ACTIONS_TABLE,
    CREATE_ACTION_COMMENTS_TABLE,
    CREATE_ACTION_RESOURCES_TABLE,
    CREATE_NOTIFICATIONS_TABLE,
    CREATE_USER_DEACTIVATION_REQUESTS_TABLE,
    CREATE_AUDIT_REPORTS_TABLE,
    CREATE_OPPORTUNITIES_TABLE
]


async def init_db():
    """Initialize the database with tables."""
    try:
        logger.info("Initializing database...")
        
        # Ensure database directory exists
        db_path = settings.DATABASE_URL.replace("sqlite:///", "")
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        # Create tables
        async with aiosqlite.connect(db_path) as conn:
            for i, create_statement in enumerate(CREATE_TABLES):
                try:
                    logger.info(f"Executing SQL statement {i+1}: {create_statement}")
                    await conn.execute(create_statement)
                except Exception as e:
                    logger.error(f"Error executing statement {i+1}: {e}")
                    logger.error(f"Statement was: {create_statement}")
                    raise
            await conn.commit()
            
            # Run migrations: add missing columns to existing tables
            migrations = [
                ("processes", "owner", "TEXT"),
                ("processes", "leader_id", "INTEGER"),
                ("processes", "priority", "TEXT DEFAULT 'medium'"),
                ("processes", "departmentId", "TEXT"),
            ]
            
            for table, column, col_type in migrations:
                try:
                    await conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
                    logger.info(f"Added column {column} to {table}")
                    await conn.commit()
                except Exception as e:
                    # Column likely already exists, this is expected
                    if "duplicate column" in str(e).lower():
                        logger.info(f"Column {column} already exists in {table}")
                    else:
                        logger.warning(f"Could not add column {column} to {table}: {e}")
        
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise

