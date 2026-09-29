import pytest
import bcrypt
from httpx import AsyncClient
from app.db.database import insert

@pytest.mark.asyncio
async def test_auth_login_success_and_failure(async_client: AsyncClient, setup_test_db_env):
    # Insert user with hashed password
    hashed = bcrypt.hashpw("secret123".encode(), bcrypt.gensalt()).decode()
    await insert(
        "INSERT INTO users (name, email, password, roles, is_active) VALUES (?, ?, ?, ?, 1)",
        ("Auth User", "auth@elcomite.org", hashed, "admin,process_leader")
    )

    # Success login with OAuth form
    response = await async_client.post(
        "/api/auth/login",
        data={"username": "auth@elcomite.org", "password": "secret123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["active_role"] == "admin"

    # Failed login wrong password
    response_fail = await async_client.post(
        "/api/auth/login",
        data={"username": "auth@elcomite.org", "password": "wrongpassword"}
    )
    assert response_fail.status_code == 401

    # Form token endpoint
    res_token = await async_client.post(
        "/api/auth/token",
        data={"username": "auth@elcomite.org", "password": "secret123"}
    )
    assert res_token.status_code == 200

@pytest.mark.asyncio
async def test_auth_me_and_switch_role(async_client: AsyncClient, admin_user):
    # Test /api/auth/me
    response = await async_client.get("/api/auth/me", headers=admin_user["headers"])
    assert response.status_code == 200
    assert response.json()["email"] == admin_user["email"]

    # Test /api/auth/switch-role to valid role
    switch_res = await async_client.post(
        "/api/auth/switch-role",
        headers=admin_user["headers"],
        json={"role": "process_leader"}
    )
    assert switch_res.status_code == 200
    assert switch_res.json()["active_role"] == "process_leader"

    # Test /api/auth/switch-role to invalid role (403)
    switch_fail = await async_client.post(
        "/api/auth/switch-role",
        headers=admin_user["headers"],
        json={"role": "auditor"}
    )
    assert switch_fail.status_code == 403
