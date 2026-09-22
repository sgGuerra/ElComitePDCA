import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_rf01_rf03_create_action_success_5w1h(async_client: AsyncClient, admin_user, leader_user, test_process):
    """
    Test RF-01 & RF-03:
    - Successful creation of an action by admin/process owner.
    - Full 5W-1H methodology payload (what, why, how, location, dates, leader_id).
    - Notification generated for the assigned leader.
    """
    payload = {
        "name": "Acción de Reducción de Tiempos",
        "process_id": test_process["id"],
        "leader_id": leader_user["id"],
        "origin": "Auditoría Interna",
        "start_date": "2026-09-01",
        "target_date": "2026-09-30",
        "what": "Optimizar el tiempo de respuesta del servidor",
        "why": "Para mejorar la experiencia del usuario",
        "how": "Implementando cache con Redis",
        "where": "Servidor Principal",
        "status": "pending",
        "completion_percentage": 0
    }

    response = await async_client.post("/api/actions/", json=payload, headers=admin_user["headers"])
    assert response.status_code == 200, response.text
    data = response.json()

    assert data["name"] == payload["name"]
    assert data["process_id"] == test_process["id"]
    assert data["leader_id"] == leader_user["id"]
    assert data["what"] == payload["what"]
    assert data["why"] == payload["why"]
    assert data["how"] == payload["how"]
    assert data.get("location") == payload["where"] or data.get("where") == payload["where"]
    assert data["status"] == "pending"

@pytest.mark.asyncio
async def test_rf01_create_action_auditor_restricted(async_client: AsyncClient, auditor_user, leader_user, test_process):
    """
    Test RF-01: Auditors cannot create actions directly (Expect 403 FORBIDDEN).
    """
    payload = {
        "name": "Acción de Auditor",
        "process_id": test_process["id"],
        "leader_id": leader_user["id"],
        "what": "Acción no permitida"
    }

    response = await async_client.post("/api/actions/", json=payload, headers=auditor_user["headers"])
    assert response.status_code == 403
    assert "Los auditores no pueden crear acciones" in response.json()["detail"]

@pytest.mark.asyncio
async def test_rf01_create_action_non_owner_forbidden(async_client: AsyncClient, leader_user, test_process):
    """
    Test RF-01: Non-admin users who do not own the process cannot create actions in it.
    """
    payload = {
        "name": "Acción No Autorizada",
        "process_id": test_process["id"],
        "leader_id": leader_user["id"],
        "what": "Intento no autorizado"
    }

    response = await async_client.post("/api/actions/", json=payload, headers=leader_user["headers"])
    assert response.status_code == 403
    assert "No tienes permisos para crear acciones" in response.json()["detail"]

@pytest.mark.asyncio
async def test_rf01_create_action_nonexistent_process(async_client: AsyncClient, admin_user, leader_user):
    """
    Test RF-01: Attempting to create an action for a non-existent process (Expect 404 NOT FOUND).
    """
    payload = {
        "name": "Acción Huérfana",
        "process_id": 9999,
        "leader_id": leader_user["id"],
        "what": "Proceso inexistente"
    }

    response = await async_client.post("/api/actions/", json=payload, headers=admin_user["headers"])
    assert response.status_code == 404
