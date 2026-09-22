import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_rf02_leader_update_allowed_fields(async_client: AsyncClient, admin_user, leader_user, test_process):
    """
    Test RF-02: Action Leader can update allowed fields (status, completion_percentage, evidence).
    """
    # 1. Admin creates an action assigned to leader_user
    create_payload = {
        "name": "Implementar Backup Automatizado",
        "process_id": test_process["id"],
        "leader_id": leader_user["id"],
        "what": "Configurar script de respaldo diario",
        "status": "pending",
        "completion_percentage": 0
    }
    create_res = await async_client.post("/api/actions/", json=create_payload, headers=admin_user["headers"])
    assert create_res.status_code == 200
    action_id = create_res.json()["id"]

    # 2. Leader updates status and completion percentage
    update_payload = {
        "status": "in_progress",
        "completion_percentage": 50
    }
    update_res = await async_client.put(f"/api/actions/{action_id}", json=update_payload, headers=leader_user["headers"])
    assert update_res.status_code == 200, update_res.text
    data = update_res.json()
    assert data["status"] == "in_progress"
    assert data["completion_percentage"] == 50

@pytest.mark.asyncio
async def test_rf02_leader_update_restricted_fields_forbidden(async_client: AsyncClient, admin_user, leader_user, test_process):
    """
    Test RF-02: Action Leader is FORBIDDEN from updating restricted fields (e.g. name) unless admin/owner.
    """
    # 1. Admin creates action assigned to leader_user
    create_payload = {
        "name": "Revisión de Servidores",
        "process_id": test_process["id"],
        "leader_id": leader_user["id"],
        "what": "Mantenimiento preventivo"
    }
    create_res = await async_client.post("/api/actions/", json=create_payload, headers=admin_user["headers"])
    action_id = create_res.json()["id"]

    # 2. Leader attempts to change the action name (Restricted field)
    invalid_update = {
        "name": "Nuevo Nombre Cambiado por el Líder",
        "status": "in_progress"
    }
    update_res = await async_client.put(f"/api/actions/{action_id}", json=invalid_update, headers=leader_user["headers"])
    assert update_res.status_code == 403
    assert "Solo puedes actualizar el estado" in update_res.json()["detail"]
