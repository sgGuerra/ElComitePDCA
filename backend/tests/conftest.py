"""
Configuración compartida (fixtures) para todas las pruebas unitarias.

Provee:
- Aplicación FastAPI de prueba con base de datos en memoria (SQLite).
- Cliente HTTP asíncrono (httpx.AsyncClient).
- Funciones auxiliares para crear usuarios y generar tokens JWT.
"""

import asyncio
import sqlite3
from typing import Dict, Any, List, Optional

import pytest
import pytest_asyncio
import aiosqlite
from httpx import AsyncClient, ASGITransport

# ---------------------------------------------------------------------------
# Monkey-patch del módulo database ANTES de importar la app para que use
# una BD en memoria compartida durante toda la sesión de tests.
# ---------------------------------------------------------------------------
TEST_DB_PATH = "file::memory:?cache=shared"

import app.db.database as db_module
import app.core.config as config_module

# Guardar originales
_original_execute = db_module.execute
_original_insert = db_module.insert

# ---------------------------------------------------------------------------
# Conexión persistente: mantiene viva la BD en memoria durante toda la sesión.
# Sin ella, SQLite libera la BD al cerrar todas las conexiones.
# ---------------------------------------------------------------------------
_persistent_conn: Optional[aiosqlite.Connection] = None


async def _get_persistent_conn() -> aiosqlite.Connection:
    """Obtener (o crear) la conexión persistente a la BD de prueba."""
    global _persistent_conn
    if _persistent_conn is None:
        _persistent_conn = await aiosqlite.connect(TEST_DB_PATH, uri=True)
    return _persistent_conn


async def _test_execute(query: str, params: tuple = (), fetchone: bool = False):
    """execute() apuntando a la BD de prueba en memoria."""
    async with aiosqlite.connect(TEST_DB_PATH, uri=True) as conn:
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


async def _test_get_one(query: str, params: tuple = ()):
    return await _test_execute(query, params, fetchone=True)


async def _test_get_all(query: str, params: tuple = ()):
    return await _test_execute(query, params, fetchone=False)


async def _test_insert(query: str, params: tuple = ()):
    async with aiosqlite.connect(TEST_DB_PATH, uri=True) as conn:
        cursor = await conn.cursor()
        await cursor.execute(query, params)
        await conn.commit()
        return cursor.lastrowid


# Aplicar monkey-patch
db_module.execute = _test_execute
db_module.get_one = _test_get_one
db_module.get_all = _test_get_all
db_module.insert = _test_insert

# Ahora sí importamos la app
from app.main import app as fastapi_app  # noqa: E402
from app.core.auth import create_access_token  # noqa: E402
from app.core.config import settings  # noqa: E402
from app.db.init_db import CREATE_TABLES  # noqa: E402


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def event_loop():
    """Crear un único event loop para toda la sesión de pruebas."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    """Recrear todas las tablas antes de CADA test para aislamiento."""
    # Asegurar que la conexión persistente existe (mantiene la BD viva)
    persistent = await _get_persistent_conn()

    async with aiosqlite.connect(TEST_DB_PATH, uri=True) as conn:
        # Obtener tablas existentes
        cursor = await conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence'"
        )
        tables = await cursor.fetchall()
        for (table_name,) in tables:
            await conn.execute(f"DROP TABLE IF EXISTS {table_name}")
        await conn.commit()

        # Crear tablas nuevas
        for statement in CREATE_TABLES:
            await conn.execute(statement)
        await conn.commit()
    yield

    # No cerramos la conexión persistente aquí; se cierra al final de la sesión


@pytest_asyncio.fixture(autouse=True, scope="session")
async def cleanup_persistent_conn():
    """Cerrar la conexión persistente al final de la sesión de pruebas."""
    yield
    global _persistent_conn
    if _persistent_conn is not None:
        await _persistent_conn.close()
        _persistent_conn = None


@pytest_asyncio.fixture
async def client():
    """Cliente HTTP asíncrono contra la app FastAPI."""
    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def create_test_user(
    name: str = "Test User",
    email: str = "test@example.com",
    password: str = "Test1234!",
    roles: str = "process_leader",
    is_active: int = 1,
) -> Dict[str, Any]:
    """Insertar un usuario directamente en la BD de prueba y devolver su dict."""
    import bcrypt
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    user_id = await _test_insert(
        "INSERT INTO users (name, email, password, roles, is_active) VALUES (?, ?, ?, ?, ?)",
        (name, email, hashed, roles, is_active),
    )
    user = await _test_get_one("SELECT * FROM users WHERE id = ?", (user_id,))
    user["roles"] = user["roles"].split(",")
    return user


def make_token(
    user: Dict[str, Any],
    active_role: Optional[str] = None,
) -> str:
    """Generar un JWT válido para un usuario de prueba."""
    role = active_role or user["roles"][0]
    return create_access_token(
        subject=user["id"],
        extra_data={
            "email": user["email"],
            "name": user["name"],
            "roles": user["roles"],
            "active_role": role,
        },
    )


def auth_headers(token: str) -> Dict[str, str]:
    """Devolver headers de autorización Bearer."""
    return {"Authorization": f"Bearer {token}"}


async def create_test_process(
    name: str = "Proceso de Prueba",
    created_by: int = 1,
    leader_id: int = 1,
) -> Dict[str, Any]:
    """Insertar un proceso directamente en la BD."""
    process_id = await _test_insert(
        "INSERT INTO processes (name, description, status, created_by, leader_id) VALUES (?, ?, ?, ?, ?)",
        (name, "Descripción de prueba", "active", created_by, leader_id),
    )
    process = await _test_get_one("SELECT * FROM processes WHERE id = ?", (process_id,))
    return process


async def create_test_action(
    process_id: int,
    leader_id: int,
    created_by: int,
    name: str = "Acción de Prueba",
    status: str = "pending",
    target_date: str = None,
) -> Dict[str, Any]:
    """Insertar una acción directamente en la BD."""
    action_id = await _test_insert(
        """INSERT INTO actions (name, process_id, leader_id, created_by, status, target_date)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (name, process_id, leader_id, created_by, status, target_date),
    )
    action = await _test_get_one("SELECT * FROM actions WHERE id = ?", (action_id,))
    return action


async def assign_leader_to_process(process_id: int, leader_id: int, created_by: int):
    """Asignar un líder a un proceso en la tabla process_leaders."""
    await _test_insert(
        "INSERT INTO process_leaders (process_id, leader_id, created_by) VALUES (?, ?, ?)",
        (process_id, leader_id, created_by),
    )
