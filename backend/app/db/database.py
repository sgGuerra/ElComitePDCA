import sqlite3
import aiosqlite
import logging
import os
from pathlib import Path

from app.core.config import settings

logger = logging.getLogger(__name__)

# Ensure database directory exists
database_dir = os.path.dirname(settings.DATABASE_URL.replace("sqlite:///", ""))
if not os.path.exists(database_dir):
    os.makedirs(database_dir)


async def get_db_connection():
    """Get a database connection."""
    conn = await aiosqlite.connect(settings.DATABASE_URL.replace("sqlite:///", ""))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        await conn.close()


async def execute(query: str, params: tuple = (), fetchone: bool = False):
    """Execute a query and optionally fetch results."""
    async with aiosqlite.connect(settings.DATABASE_URL.replace("sqlite:///", "")) as conn:
        conn.row_factory = sqlite3.Row
        cursor = await conn.cursor()
        await cursor.execute(query, params)
        await conn.commit()
        
        if fetchone:
            result = await cursor.fetchone()
            return dict(result) if result else None
        else:
            result = await cursor.fetchall()
            return [dict(row) for row in result] if result else []


async def get_one(query: str, params: tuple = ()):
    """Fetch a single row."""
    return await execute(query, params, fetchone=True)


async def get_all(query: str, params: tuple = ()):
    """Fetch all rows."""
    return await execute(query, params, fetchone=False)


async def insert(query: str, params: tuple = ()):
    """Insert a row and return the last inserted row id."""
    async with aiosqlite.connect(settings.DATABASE_URL.replace("sqlite:///", "")) as conn:
        cursor = await conn.cursor()
        await cursor.execute(query, params)
        await conn.commit()
        return cursor.lastrowid


async def transaction(coroutines):
    """
    Execute multiple coroutines in a transaction.
    Each coroutine should be a function that takes a connection as an argument.
    """
    async with aiosqlite.connect(settings.DATABASE_URL.replace("sqlite:///", "")) as conn:
        conn.row_factory = sqlite3.Row
        await conn.execute("BEGIN TRANSACTION")
        try:
            results = []
            for coro in coroutines:
                result = await coro(conn)
                results.append(result)
            await conn.commit()
            return results
        except Exception as e:
            await conn.rollback()
            logger.error(f"Transaction error: {str(e)}")
            raise
