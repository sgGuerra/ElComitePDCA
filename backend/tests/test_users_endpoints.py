import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_users_crud_flow(async_client: AsyncClient, admin_user, leader_user):
    # 1. List users as admin
    res = await async_client.get("/api/users/", headers=admin_user["headers"])
    assert res.status_code == 200
    users_list = res.json()
    assert len(users_list) >= 2

    # 2. List users as leader (should fail 403)
    res_forbidden = await async_client.get("/api/users/", headers=leader_user["headers"])
    assert res_forbidden.status_code == 403

    # 3. Create user as admin
    new_user_payload = {
        "name": "Nuevo Usuario",
        "email": "nuevo@elcomite.org",
        "password": "Password123!",
        "roles": ["process_leader"]
    }
    create_res = await async_client.post("/api/users/", headers=admin_user["headers"], json=new_user_payload)
    assert create_res.status_code == 200
    created_id = create_res.json()["id"]

    # 4. Read user by ID (self, admin, other)
    res_self = await async_client.get(f"/api/users/{leader_user['id']}", headers=leader_user["headers"])
    assert res_self.status_code == 200

    res_admin_view = await async_client.get(f"/api/users/{created_id}", headers=admin_user["headers"])
    assert res_admin_view.status_code == 200

    # 5. Filter by role
    res_by_role = await async_client.get("/api/users/by-role/process_leader", headers=admin_user["headers"])
    assert res_by_role.status_code == 200
    assert any(u["id"] == created_id for u in res_by_role.json())

    # 6. Update user
    update_payload = {"name": "Usuario Actualizado"}
    update_res = await async_client.put(f"/api/users/{created_id}", headers=admin_user["headers"], json=update_payload)
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Usuario Actualizado"

    # 7. Deactivate user
    deact_res = await async_client.post(f"/api/users/{created_id}/deactivate", headers=admin_user["headers"])
    assert deact_res.status_code == 200
    assert deact_res.json()["success"] is True
