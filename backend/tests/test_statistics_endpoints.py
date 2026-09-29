import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_statistics_endpoints_all(async_client: AsyncClient, admin_user, test_process):
    proc_id = test_process["id"]

    # 1. Dashboard statistics
    dash_res = await async_client.get("/api/statistics/dashboard", headers=admin_user["headers"])
    assert dash_res.status_code == 200

    # 2. Actions by type
    by_type_res = await async_client.get("/api/statistics/actions-by-type", headers=admin_user["headers"])
    assert by_type_res.status_code == 200

    # 3. Actions by status
    by_status_res = await async_client.get(
        f"/api/statistics/actions-by-status?process_id={proc_id}&date_range=month&include_actions=true",
        headers=admin_user["headers"]
    )
    assert by_status_res.status_code == 200

    # 4. Upcoming deadlines
    deadlines_res = await async_client.get(
        f"/api/statistics/upcoming-deadlines?process_id={proc_id}&date_range=month",
        headers=admin_user["headers"]
    )
    assert deadlines_res.status_code == 200

    # 5. Completion rate
    rate_res = await async_client.get(
        f"/api/statistics/completion-rate?process_id={proc_id}&date_range=month",
        headers=admin_user["headers"]
    )
    assert rate_res.status_code == 200

    # 6. Actions over time
    over_time_res = await async_client.get(
        f"/api/statistics/actions-over-time?process_id={proc_id}&group_by=month",
        headers=admin_user["headers"]
    )
    assert over_time_res.status_code == 200

    # 7. Process statistics
    proc_stats_res = await async_client.get("/api/statistics/process-statistics", headers=admin_user["headers"])
    assert proc_stats_res.status_code == 200
