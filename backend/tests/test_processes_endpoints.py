import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_processes_crud_flow(async_client: AsyncClient, admin_user, leader_user):
    # 1. Create process as admin
    proc_payload = {
        "name": "Proceso Logística",
        "description": "Gestión de inventarios y logística"
    }
    create_res = await async_client.post("/api/processes/", headers=admin_user["headers"], json=proc_payload)
    assert create_res.status_code == 200
    proc_data = create_res.json()
    proc_id = proc_data["id"]
    assert proc_data["name"] == "Proceso Logística"

    # 2. List processes with stats as admin
    list_res = await async_client.get("/api/processes/?stats=true", headers=admin_user["headers"])
    assert list_res.status_code == 200
    assert any(p["id"] == proc_id for p in list_res.json())

    # 3. Read specific process
    get_res = await async_client.get(f"/api/processes/{proc_id}", headers=admin_user["headers"])
    assert get_res.status_code == 200
    assert get_res.json()["id"] == proc_id

    # 4. Update process
    update_res = await async_client.put(
        f"/api/processes/{proc_id}",
        headers=admin_user["headers"],
        json={"name": "Proceso Logística y Cadena", "status": "active"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Proceso Logística y Cadena"

    # 5. Non-existent process (404)
    not_found_res = await async_client.get("/api/processes/999999", headers=admin_user["headers"])
    assert not_found_res.status_code == 404

    # 6. Delete process
    del_res = await async_client.delete(f"/api/processes/{proc_id}", headers=admin_user["headers"])
    assert del_res.status_code == 200
