import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_actions_endpoints_extended(async_client: AsyncClient, admin_user, leader_user, test_process):
    proc_id = test_process["id"]
    leader_id = leader_user["id"]

    # 1. Create action
    action_payload = {
        "name": "Implementar Control de Calidad",
        "process_id": proc_id,
        "leader_id": leader_id,
        "origin": "Auditoría Interna",
        "start_date": "2026-09-01",
        "target_date": "2026-10-30",
        "what": "Revisar procesos clave",
        "why": "Mejora continua",
        "how": "Muestreo estadístico",
        "location": "Planta 1",
        "status": "pending",
        "completion_percentage": 10
    }
    create_res = await async_client.post("/api/actions/", headers=admin_user["headers"], json=action_payload)
    assert create_res.status_code == 200
    action_data = create_res.json()
    action_id = action_data["id"]

    # 2. Get actions by process
    by_proc_res = await async_client.get(f"/api/actions/process/{proc_id}", headers=admin_user["headers"])
    assert by_proc_res.status_code == 200
    assert len(by_proc_res.json()) >= 1

    # 3. Get actions by leader
    by_leader_res = await async_client.get(f"/api/actions/leader/{leader_id}", headers=admin_user["headers"])
    assert by_leader_res.status_code == 200

    # 4. Get statistics
    stats_res = await async_client.get("/api/actions/statistics", headers=admin_user["headers"])
    assert stats_res.status_code == 200

    stats_proc_res = await async_client.get(f"/api/actions/statistics?process_id={proc_id}", headers=admin_user["headers"])
    assert stats_proc_res.status_code == 200

    # 5. Upcoming deadlines
    deadlines_res = await async_client.get("/api/actions/upcoming-deadlines", headers=admin_user["headers"])
    assert deadlines_res.status_code == 200

    # 6. Get action by ID
    get_res = await async_client.get(f"/api/actions/{action_id}", headers=admin_user["headers"])
    assert get_res.status_code == 200
    assert get_res.json()["id"] == action_id

    # 7. Update action
    update_res = await async_client.put(
        f"/api/actions/{action_id}",
        headers=admin_user["headers"],
        json={"name": "Control de Calidad Avanzado", "completion_percentage": 50, "status": "in_progress"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["completion_percentage"] == 50

    # 8. Create action with form / evidence endpoint
    form_data = {
        "process_id": str(proc_id),
        "leader_id": str(leader_id),
        "name": "Acción con evidencia",
        "origin": "Revisión",
        "status": "pending",
        "completion_percentage": "0"
    }
    create_form_res = await async_client.post("/api/actions/with-evidence", headers=admin_user["headers"], data=form_data)
    assert create_form_res.status_code == 200
    form_action_id = create_form_res.json()["id"]

    # 9. Update action with form / evidence endpoint
    update_form_res = await async_client.put(
        f"/api/actions/{form_action_id}/with-evidence",
        headers=admin_user["headers"],
        data={"name": "Acción actualizada con form", "completion_percentage": "20"}
    )
    assert update_form_res.status_code == 200

    # 10. Delete actions
    del_res = await async_client.delete(f"/api/actions/{action_id}", headers=admin_user["headers"])
    assert del_res.status_code == 200

    del_form_res = await async_client.delete(f"/api/actions/{form_action_id}", headers=admin_user["headers"])
    assert del_form_res.status_code == 200
