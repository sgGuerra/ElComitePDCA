import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_rf04_assign_leader_admin_success(async_client: AsyncClient, admin_user, leader_user, test_process):
    """
    Test RF-04: Admin can assign a leader to a process (POST /api/assignments/).
    """
    payload = {
        "process_id": test_process["id"],
        "leader_id": leader_user["id"]
    }
    res = await async_client.post("/api/assignments", json=payload, headers=admin_user["headers"])
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["process_id"] == test_process["id"]
    assert data["leader_id"] == leader_user["id"]

@pytest.mark.asyncio
async def test_rf04_assign_leader_non_admin_forbidden(async_client: AsyncClient, leader_user, test_process):
    """
    Test RF-04: Non-admin users cannot assign leaders to processes (Expect 403 FORBIDDEN).
    """
    payload = {
        "process_id": test_process["id"],
        "leader_id": leader_user["id"]
    }
    res = await async_client.post("/api/assignments", json=payload, headers=leader_user["headers"])
    assert res.status_code == 403

@pytest.mark.asyncio
async def test_rf04_transfer_leadership_success(async_client: AsyncClient, admin_user, leader_user, create_user, test_process):
    """
    Test RF-04: Admin can transfer leadership from one leader to another (POST /api/assignments/transfer).
    """
    new_leader = await create_user("Nuevo Líder", "nuevo@elcomite.org", roles="process_leader", active_role="process_leader")

    # First assign leader_user
    assign_payload = {"process_id": test_process["id"], "leader_id": leader_user["id"]}
    await async_client.post("/api/assignments", json=assign_payload, headers=admin_user["headers"])

    # Now transfer to new_leader
    transfer_params = {
        "process_id": test_process["id"],
        "old_leader_id": leader_user["id"],
        "new_leader_id": new_leader["id"]
    }
    res = await async_client.post("/api/assignments/transfer", params=transfer_params, headers=admin_user["headers"])
    assert res.status_code == 200, res.text
    assert res.json()["success"] is True

@pytest.mark.asyncio
async def test_rf04_remove_leader_success(async_client: AsyncClient, admin_user, leader_user, test_process):
    """
    Test RF-04: Admin can remove a leader from a process (DELETE /api/assignments/{process_id}/{leader_id}).
    """
    # Assign leader first
    assign_payload = {"process_id": test_process["id"], "leader_id": leader_user["id"]}
    await async_client.post("/api/assignments", json=assign_payload, headers=admin_user["headers"])

    # Remove leader
    del_res = await async_client.delete(f"/api/assignments/{test_process['id']}/{leader_user['id']}", headers=admin_user["headers"])
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

@pytest.mark.asyncio
async def test_rf04_remove_leader_nonexistent(async_client: AsyncClient, admin_user, test_process):
    """
    Test RF-04: Removing non-existent assignment returns HTTP 404.
    """
    del_res = await async_client.delete(f"/api/assignments/{test_process['id']}/9999", headers=admin_user["headers"])
    assert del_res.status_code == 404
