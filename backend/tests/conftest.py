import os
import sys
import tempfile
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
import aiosqlite

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.auth import create_access_token
from app.db.init_db import init_db
from app.db.database import insert, execute
from app.main import app

@pytest.fixture(scope="session", autouse=True)
def setup_test_db_env():
    """Setup temporary SQLite database for testing."""
    test_db_file = tempfile.NamedTemporaryFile(suffix=".sqlite", delete=False)
    test_db_path = os.path.abspath(test_db_file.name)
    test_db_file.close()

    # Override database URL for tests
    settings.DATABASE_URL = f"sqlite:///{test_db_path}"

    yield test_db_path

    # Cleanup temp db
    if os.path.exists(test_db_path):
        os.remove(test_db_path)

@pytest_asyncio.fixture(scope="function", autouse=True)
async def init_test_db(setup_test_db_env):
    """Initialize database tables before each test."""
    await init_db()
    
    # Clear tables before each test
    tables = [
        "actions", "process_leaders", "processes", "users",
        "notifications", "action_comments", "action_resources"
    ]
    for table in tables:
        await execute(f"DELETE FROM {table};")
        try:
            await execute(f"DELETE FROM sqlite_sequence WHERE name='{table}';")
        except Exception:
            pass

@pytest_asyncio.fixture
async def create_user(setup_test_db_env):
    """Factory fixture to create test users in DB."""
    async def _create_user(name: str, email: str, roles: str = "process_leader", active_role: str = "process_leader"):
        user_id = await insert(
            """
            INSERT INTO users (name, email, password, roles, is_active)
            VALUES (?, ?, 'hashed_pass', ?, 1)
            """,
            (name, email, roles)
        )
        
        token_extra = {
            "email": email,
            "roles": roles.split(","),
            "active_role": active_role,
            "name": name
        }
        token = create_access_token(subject=user_id, extra_data=token_extra)
        headers = {"Authorization": f"Bearer {token}"}
        
        return {
            "id": user_id,
            "name": name,
            "email": email,
            "roles": roles.split(","),
            "active_role": active_role,
            "token": token,
            "headers": headers
        }
    return _create_user

@pytest_asyncio.fixture
async def admin_user(create_user):
    return await create_user("Admin User", "admin@elcomite.org", roles="admin,process_leader", active_role="admin")

@pytest_asyncio.fixture
async def leader_user(create_user):
    return await create_user("Leader User", "leader@elcomite.org", roles="process_leader", active_role="process_leader")

@pytest_asyncio.fixture
async def auditor_user(create_user):
    return await create_user("Auditor User", "auditor@elcomite.org", roles="auditor", active_role="auditor")

@pytest_asyncio.fixture
async def test_process(setup_test_db_env, admin_user):
    """Fixture to create a test process."""
    process_id = await insert(
        """
        INSERT INTO processes (name, description, created_by, status)
        VALUES (?, ?, ?, 'active')
        """,
        ("Proceso de Calidad", "Descripción del proceso de calidad", admin_user["id"])
    )
    return {"id": process_id, "name": "Proceso de Calidad", "created_by": admin_user["id"]}

@pytest_asyncio.fixture
async def async_client():
    """Async HTTP client for FastAPI app testing with redirects enabled."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", follow_redirects=True) as client:
        yield client
