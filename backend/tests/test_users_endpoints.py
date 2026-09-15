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

    @pytest.mark.asyncio
    async def test_transfer_user_processes_no_processes(self, client):
        admin = await create_test_user(name="Admin Transfer Empty", email="admintransferempty@users.com", roles="admin")
        leader1 = await create_test_user(name="Leader No Proc", email="leadernoproc@users.com", roles="process_leader")
        leader2 = await create_test_user(name="Leader Target", email="leadertarget@users.com", roles="process_leader")
        
        token = make_token(admin)
        response = await client.post(
            f"/api/users/{leader1['id']}/transfer-processes/{leader2['id']}",
            headers=auth_headers(token)
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["message"] == "No hay procesos para transferir"

    @pytest.mark.asyncio
    async def test_read_user_not_found(self, client):
        admin = await create_test_user(name="Admin 404", email="admin404@users.com", roles="admin")
        token = make_token(admin)
        response = await client.get("/api/users/999999", headers=auth_headers(token))
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_deactivate_user_not_found(self, client, monkeypatch):
        admin = await create_test_user(name="Admin Deact 404", email="admindeact404@users.com", roles="admin")
        token = make_token(admin)

        async def mock_get_user(user_id):
            return {"roles": ["auditor"]}
        async def mock_update_user(user_id, update_data):
            return None

        monkeypatch.setattr("app.api.endpoints.users.get_user_by_id", mock_get_user)
        monkeypatch.setattr("app.api.endpoints.users.update_user", mock_update_user)

        response = await client.post("/api/users/999999/deactivate", headers=auth_headers(token))
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_get_process_leaders_fallback_fields(self, client, monkeypatch):
        user = await create_test_user(name="Viewer Fallback", email="viewerfallback@users.com")
        token = make_token(user)

        async def mock_get_users_by_role(role):
            if role == "process_leader":
                return [{"id": 101, "name": "L1", "email": "l1@test.com", "roles": ["process_leader"]}]
            return [{"id": 102, "name": "A1", "email": "a1@test.com", "roles": ["admin"]}]

        monkeypatch.setattr("app.api.endpoints.users.get_users_by_role", mock_get_users_by_role)

        response = await client.get("/api/users/process-leaders", headers=auth_headers(token))
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 2

    @pytest.mark.asyncio
    async def test_update_user_own_profile(self, client):
        user = await create_test_user(name="Update Me", email="updateme@users.com")
        token = make_token(user)
        
        response = await client.put(
            f"/api/users/{user['id']}",
            json={"name": "Updated Name"},
            headers=auth_headers(token)
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["name"] == "Updated Name"

    @pytest.mark.asyncio
    async def test_update_user_other_profile_forbidden(self, client):
        user1 = await create_test_user(name="User 1 Update", email="u1up@users.com")
        user2 = await create_test_user(name="User 2 Update", email="u2up@users.com")
        token = make_token(user1)
        
        response = await client.put(
            f"/api/users/{user2['id']}",
            json={"name": "Hacked Name"},
            headers=auth_headers(token)
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_update_user_roles_non_admin_forbidden(self, client):
        user = await create_test_user(name="Self Promote", email="selfpromote@users.com")
        token = make_token(user)
        
        response = await client.put(
            f"/api/users/{user['id']}",
            json={"roles": ["admin"]},
            headers=auth_headers(token)
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "roles" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_update_user_admin_success(self, client):
        admin = await create_test_user(name="Admin Updater", email="adminup@users.com", roles="admin")
        user = await create_test_user(name="Target User", email="targetup@users.com")
        token = make_token(admin)
        
        response = await client.put(
            f"/api/users/{user['id']}",
            json={"name": "Admin Modified", "roles": ["auditor"]},
            headers=auth_headers(token)
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "Admin Modified"
        assert "auditor" in data["roles"]

    @pytest.mark.asyncio
    async def test_update_user_not_found(self, client):
        admin = await create_test_user(name="Admin Update 404", email="adminup404@users.com", roles="admin")
        token = make_token(admin)
        
        response = await client.put(
            "/api/users/999999",
            json={"name": "Ghost User"},
            headers=auth_headers(token)
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_deactivate_user_success(self, client):
        admin = await create_test_user(name="Admin Deact", email="admindeact@users.com", roles="admin")
        user_to_deact = await create_test_user(name="Auditor Deact", email="auddeact@users.com", roles="auditor")
        token = make_token(admin)
        
        response = await client.post(
            f"/api/users/{user_to_deact['id']}/deactivate",
            headers=auth_headers(token)
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["success"] is True

    @pytest.mark.asyncio
    async def test_deactivate_user_with_assigned_processes_fails(self, client):
        admin = await create_test_user(name="Admin Deact Leader", email="admindeactleader@users.com", roles="admin")
        leader = await create_test_user(name="Busy Leader", email="busyleader@users.com", roles="process_leader")
        
        from tests.conftest import assign_leader_to_process
        process = await create_test_process(name="Active Process", leader_id=leader["id"])
        await assign_leader_to_process(process["id"], leader["id"], admin["id"])
        
        token = make_token(admin)
        response = await client.post(
            f"/api/users/{leader['id']}/deactivate",
            headers=auth_headers(token)
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "procesos asignados" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_get_process_leaders_includes_admin(self, client):
        user = await create_test_user(name="Viewer Admin Leaders", email="valeaders@users.com", roles="auditor")
        admin_leader = await create_test_user(name="Admin Leader", email="adminleader@users.com", roles="admin")
        
        token = make_token(user)
        response = await client.get("/api/users/process-leaders", headers=auth_headers(token))
        assert response.status_code == status.HTTP_200_OK
        emails = [u["email"] for u in response.json()]
        assert "adminleader@users.com" in emails

    @pytest.mark.asyncio
    async def test_get_process_leaders_error(self, client, monkeypatch):
        user = await create_test_user(name="Err User", email="erruser@users.com")
        token = make_token(user)
        
        async def mock_fail(*args, **kwargs):
            raise RuntimeError("Database connection lost")
            
        monkeypatch.setattr("app.api.endpoints.users.get_users_by_role", mock_fail)
        
        response = await client.get("/api/users/process-leaders", headers=auth_headers(token))
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Error al obtener líderes" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_request_deactivation_error(self, client, monkeypatch):
        user = await create_test_user(name="Deact Fail", email="deactfail@users.com")
        token = make_token(user)
        
        async def mock_fail(*args, **kwargs):
            raise ValueError("Invalid deactivation reason")
            
        monkeypatch.setattr("app.api.endpoints.users.create_deactivation_request", mock_fail)
        
        response = await client.post(
            "/api/users/request-deactivation",
            json={"reason": "Test fail"},
            headers=auth_headers(token)
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Invalid deactivation reason" in response.json()["detail"]
