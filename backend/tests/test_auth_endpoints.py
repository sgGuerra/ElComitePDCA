import pytest
import pytest_asyncio
from fastapi import status

from tests.conftest import create_test_user, make_token, auth_headers

class TestAuthEndpoints:

    @pytest.mark.asyncio
    async def test_login_success(self, client):
        user = await create_test_user(
            name="Login User", email="login@test.com", password="Password123!", roles="process_leader"
        )
        response = await client.post(
            "/api/auth/login",
            data={"username": "login@test.com", "password": "Password123!"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user_id"] == user["id"]
        assert "process_leader" in data["user_roles"]
        assert data["active_role"] == "process_leader"

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client):
        await create_test_user(
            name="Login User", email="login_wrong@test.com", password="Password123!", roles="process_leader"
        )
        response = await client.post(
            "/api/auth/login",
            data={"username": "login_wrong@test.com", "password": "WrongPassword!"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json()["detail"] == "Incorrect email or password"

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client):
        response = await client.post(
            "/api/auth/login",
            data={"username": "doesnotexist@test.com", "password": "Password123!"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_login_with_form_success(self, client):
        user = await create_test_user(
            name="Form User", email="form@test.com", password="Password123!", roles="admin"
        )
        response = await client.post(
            "/api/auth/token",
            data={"username": "form@test.com", "password": "Password123!"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["active_role"] == "admin"

    @pytest.mark.asyncio
    async def test_get_current_user_me(self, client):
        user = await create_test_user(name="Me User", email="me@test.com")
        token = make_token(user)
        response = await client.get("/api/auth/me", headers=auth_headers(token))
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == "me@test.com"
        assert data["name"] == "Me User"

    @pytest.mark.asyncio
    async def test_get_current_user_me_no_token(self, client):
        response = await client.get("/api/auth/me")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_switch_role_success(self, client):
        user = await create_test_user(
            name="Multi Role", email="multi@test.com", roles="admin,process_leader"
        )
        token = make_token(user, active_role="process_leader")
        response = await client.post(
            "/api/auth/switch-role",
            json={"role": "admin"},
            headers=auth_headers(token)
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["active_role"] == "admin"
        assert "access_token" in data

    @pytest.mark.asyncio
    async def test_switch_role_forbidden(self, client):
        user = await create_test_user(
            name="Single Role", email="single@test.com", roles="process_leader"
        )
        token = make_token(user, active_role="process_leader")
        response = await client.post(
            "/api/auth/switch-role",
            json={"role": "admin"},
            headers=auth_headers(token)
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "does not have the admin role" in response.json()["detail"]
