import pytest
from httpx import AsyncClient
from app.models.notification import create_notification

@pytest.mark.asyncio
async def test_comments_flow(async_client: AsyncClient, admin_user, test_process):
    proc_id = test_process["id"]

    # 1. Add process comment
    add_proc_com = await async_client.post(
        f"/api/comments/process/{proc_id}?comment=Comentario%20de%20prueba%20proceso",
        headers=admin_user["headers"]
    )
    assert add_proc_com.status_code == 200
    com_data = add_proc_com.json()
    com_id = com_data["id"]

    # 2. List process comments
    list_proc_com = await async_client.get(
        f"/api/comments/process/{proc_id}",
        headers=admin_user["headers"]
    )
    assert list_proc_com.status_code == 200
    assert len(list_proc_com.json()) >= 1

    # 3. Delete process comment
    del_proc_com = await async_client.delete(
        f"/api/comments/process/comment/{com_id}",
        headers=admin_user["headers"]
    )
    assert del_proc_com.status_code == 200

@pytest.mark.asyncio
async def test_notifications_flow(async_client: AsyncClient, admin_user):
    user_id = admin_user["id"]

    # 1. Create a notification using model
    notif = await create_notification(
        user_id=user_id,
        title="Alerta Test",
        message="Mensaje de prueba"
    )
    notif_id = notif["id"]

    # 2. Get notifications count & list
    count_res = await async_client.get("/api/notifications/count", headers=admin_user["headers"])
    assert count_res.status_code == 200
    assert count_res.json()["count"] >= 1

    list_res = await async_client.get("/api/notifications/", headers=admin_user["headers"])
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 3. Read specific notification
    notif_res = await async_client.get(f"/api/notifications/{notif_id}", headers=admin_user["headers"])
    assert notif_res.status_code == 200
    assert notif_res.json()["title"] == "Alerta Test"

    # 4. Mark as read
    read_res = await async_client.put(f"/api/notifications/{notif_id}/read", headers=admin_user["headers"])
    assert read_res.status_code == 200

    # 5. Mark all as read
    read_all_res = await async_client.put("/api/notifications/read-all", headers=admin_user["headers"])
    assert read_all_res.status_code == 200

    # 6. Delete notification
    del_res = await async_client.delete(f"/api/notifications/{notif_id}", headers=admin_user["headers"])
    assert del_res.status_code == 200
