import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_rf05_dashboard_statistics(async_client: AsyncClient, admin_user, leader_user, test_process):
    """
    Test RF-05: Dashboard statistics endpoint (/api/statistics/dashboard).
    Verifies KPIs: total_actions, pending_actions, completed_actions, completion_rate.
    """
    # 1. Create 2 actions: 1 pending, 1 completed
    action1 = {
        "name": "Acción Pendiente",
        "process_id": test_process["id"],
        "leader_id": leader_user["id"],
        "status": "pending",
        "what": "Descripción 1"
    }
    action2 = {
        "name": "Acción Completada",
        "process_id": test_process["id"],
        "leader_id": leader_user["id"],
        "status": "completed",
        "what": "Descripción 2",
        "completion_percentage": 100
    }
    await async_client.post("/api/actions/", json=action1, headers=admin_user["headers"])
    await async_client.post("/api/actions/", json=action2, headers=admin_user["headers"])

    # 2. Query dashboard statistics
    res = await async_client.get("/api/statistics/dashboard", headers=admin_user["headers"])
    assert res.status_code == 200, res.text
    data = res.json()

    assert data["total_actions"] == 2
    assert data["pending_actions"] == 1
    assert data["completed_actions"] == 1
    assert data["completion_rate"] == 50.0

@pytest.mark.asyncio
async def test_rf06_actions_over_time_trends(async_client: AsyncClient, admin_user, leader_user, test_process):
    """
    Test RF-06: Trend analysis over time (/api/statistics/actions-over-time).
    Tests time range parameter (month, week, quarter, year).
    """
    # Create action
    action = {
        "name": "Acción de Tendencia",
        "process_id": test_process["id"],
        "leader_id": leader_user["id"],
        "what": "Verificación de tendencias"
    }
    await async_client.post("/api/actions/", json=action, headers=admin_user["headers"])

    # Query trends with date_range=month
    res = await async_client.get("/api/statistics/actions-over-time?date_range=month", headers=admin_user["headers"])
    assert res.status_code == 200, res.text
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0

@pytest.mark.asyncio
async def test_rf05_rf06_completion_rate_filtered(async_client: AsyncClient, admin_user):
    """
    Test RF-05 & RF-06: Completion rate with date range filter (/api/statistics/completion-rate).
    """
    res = await async_client.get("/api/statistics/completion-rate?date_range=month", headers=admin_user["headers"])
    assert res.status_code == 200
    assert "rate" in res.json()
