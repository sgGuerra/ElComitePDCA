import pytest
import pytest_asyncio
from fastapi import status

from tests.conftest import create_test_user, create_test_process, make_token, auth_headers

class TestUsersEndpoints:

    @pytest.mark.asyncio
    async def test_read_users_admin(self, client):
        admin = await create_test_user(name="Admin", email="admin@users.com", roles="admin")
        await create_test_user(name="User 1", email="user1@users.com")
        await create_test_user(name="User 2", email="user2@users.com")
        
        token = make_token(admin)
        response = await client.get("/api/users/", headers=auth_headers(token))
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) >= 3

    @pytest.mark.asyncio
    async def test_read_users_non_admin(self, client):
        user = await create_test_user(name="Non Admin", email="nonadmin@users.com", roles="process_leader")
        token = make_token(user)
        response = await client.get("/api/users/", headers=auth_headers(token))
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_create_new_user_admin(self, client):
        admin = await create_test_user(name="Admin2", email="admin2@users.com", roles="admin")
        token = make_token(admin)
        
        new_user_data = {
            "name": "New User",
            "email": "newuser@users.com",
            "password": "Password123!",
            "roles": ["auditor"]
        }
        
        response = await client.post("/api/users/", json=new_user_data, headers=auth_headers(token))
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == "newuser@users.com"
        assert "auditor" in data["roles"]

    @pytest.mark.asyncio
    async def test_create_new_user_duplicate_email(self, client):
        admin = await create_test_user(name="Admin3", email="admin3@users.com", roles="admin")
        await create_test_user(name="Existing", email="existing@users.com")
        
        token = make_token(admin)
        
        new_user_data = {
            "name": "Another",
            "email": "existing@users.com",
            "password": "Password123!",
            "roles": ["process_leader"]
        }
        
        response = await client.post("/api/users/", json=new_user_data, headers=auth_headers(token))
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already exists" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_get_users_with_role(self, client):
        admin = await create_test_user(name="Admin4", email="admin4@users.com", roles="admin")
        await create_test_user(name="Auditor 1", email="aud1@users.com", roles="auditor")
        
        token = make_token(admin)
        response = await client.get("/api/users/by-role/auditor", headers=auth_headers(token))
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) >= 1
        assert "auditor" in data[0]["roles"]

    @pytest.mark.asyncio
    async def test_get_process_leaders_list(self, client):
        user = await create_test_user(name="Viewer", email="viewer@users.com", roles="auditor")
        await create_test_user(name="Leader 1", email="leader1@users.com", roles="process_leader")
        await create_test_user(name="Inactive Leader", email="inactivel@users.com", roles="process_leader", is_active=0)
        
        token = make_token(user)
        response = await client.get("/api/users/process-leaders", headers=auth_headers(token))
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        emails = [u["email"] for u in data]
        assert "leader1@users.com" in emails
        assert "inactivel@users.com" not in emails

    @pytest.mark.asyncio
    async def test_read_user_own_profile(self, client):
        user = await create_test_user(name="Own Profile", email="own@users.com")
        token = make_token(user)
        
        response = await client.get(f"/api/users/{user['id']}", headers=auth_headers(token))
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["email"] == "own@users.com"

    @pytest.mark.asyncio
    async def test_read_user_other_profile_forbidden(self, client):
        user1 = await create_test_user(name="User A", email="usera@users.com", roles="process_leader")
        user2 = await create_test_user(name="User B", email="userb@users.com", roles="process_leader")
        
        token = make_token(user1)
        response = await client.get(f"/api/users/{user2['id']}", headers=auth_headers(token))
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_request_deactivation(self, client):
        user = await create_test_user(name="Deact Req", email="deactreq@users.com")
        token = make_token(user)
        
        response = await client.post(
            "/api/users/request-deactivation",
            json={"reason": "Leaving company"},
            headers=auth_headers(token)
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["success"] is True

    @pytest.mark.asyncio
    async def test_transfer_user_processes(self, client):
        admin = await create_test_user(name="Admin Transfer", email="admintransfer@users.com", roles="admin")
        old_leader = await create_test_user(name="Old Leader", email="oldleader@users.com", roles="process_leader")
        new_leader = await create_test_user(name="New Leader", email="newleader@users.com", roles="process_leader")
        
        # Create process assigned to old_leader
        from tests.conftest import assign_leader_to_process
        process = await create_test_process(name="Transfer Process", leader_id=old_leader["id"])
        await assign_leader_to_process(process["id"], old_leader["id"], admin["id"])
        
        token = make_token(admin)
        response = await client.post(
            f"/api/users/{old_leader['id']}/transfer-processes/{new_leader['id']}",
            headers=auth_headers(token)
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["success"] is True
        assert "transferido" in response.json()["message"]
