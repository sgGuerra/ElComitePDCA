"""
Tests para los endpoints de notificaciones (notifications.py).
Cubre listado, lectura, marcar como leída, conteo y eliminación.
"""

import pytest
import pytest_asyncio

from tests.conftest import (
    create_test_user,
    make_token,
    auth_headers,
    _test_insert,
    _test_get_one,
)


async def _create_notification(user_id, title="Notificación Test", message="Mensaje"):
    """Helper para crear una notificación directamente en BD."""
    nid = await _test_insert(
        "INSERT INTO notifications (user_id, title, message, read) VALUES (?, ?, ?, 0)",
        (user_id, title, message),
    )
    return await _test_get_one("SELECT * FROM notifications WHERE id = ?", (nid,))


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/notifications/
# ──────────────────────────────────────────────────────────────────────────────

class TestListNotifications:

    @pytest.mark.asyncio
    async def test_user_lists_own_notifications(self, client):
        user = await create_test_user(name="User", email="user@notif.com", roles="process_leader")
        await _create_notification(user["id"])
        await _create_notification(user["id"], title="Otra")
        token = make_token(user, active_role="process_leader")

        resp = await client.get("/api/notifications/", headers=auth_headers(token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 2

    @pytest.mark.asyncio
    async def test_unread_only_filter(self, client):
        user = await create_test_user(name="User", email="user@notif2.com", roles="process_leader")
        await _create_notification(user["id"])
        token = make_token(user, active_role="process_leader")

        resp = await client.get("/api/notifications/?unread_only=true", headers=auth_headers(token))
        assert resp.status_code == 200


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/notifications/count
# ──────────────────────────────────────────────────────────────────────────────

class TestNotificationCount:

    @pytest.mark.asyncio
    async def test_get_unread_count(self, client):
        user = await create_test_user(name="User", email="user@notifcnt.com", roles="process_leader")
        await _create_notification(user["id"])
        await _create_notification(user["id"])
        token = make_token(user, active_role="process_leader")

        resp = await client.get("/api/notifications/count", headers=auth_headers(token))
        assert resp.status_code == 200
        assert resp.json()["count"] >= 2


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/notifications/{id}
# ──────────────────────────────────────────────────────────────────────────────

class TestReadNotification:

    @pytest.mark.asyncio
    async def test_user_reads_own_notification(self, client):
        user = await create_test_user(name="User", email="user@notifr.com", roles="process_leader")
        notif = await _create_notification(user["id"])
        token = make_token(user, active_role="process_leader")

        resp = await client.get(f"/api/notifications/{notif['id']}", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_notification_not_found(self, client):
        user = await create_test_user(name="User", email="user@notifr2.com", roles="process_leader")
        token = make_token(user, active_role="process_leader")

        resp = await client.get("/api/notifications/9999", headers=auth_headers(token))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_cannot_read_other_users_notification(self, client):
        user1 = await create_test_user(name="User1", email="user1@notifr.com", roles="process_leader")
        user2 = await create_test_user(name="User2", email="user2@notifr.com", roles="process_leader")
        notif = await _create_notification(user1["id"])
        token = make_token(user2, active_role="process_leader")

        resp = await client.get(f"/api/notifications/{notif['id']}", headers=auth_headers(token))
        assert resp.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# PUT /api/notifications/{id}/read
# ──────────────────────────────────────────────────────────────────────────────

class TestMarkAsRead:

    @pytest.mark.asyncio
    async def test_mark_as_read(self, client):
        user = await create_test_user(name="User", email="user@notifm.com", roles="process_leader")
        notif = await _create_notification(user["id"])
        token = make_token(user, active_role="process_leader")

        resp = await client.put(f"/api/notifications/{notif['id']}/read", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_mark_as_read_not_found(self, client):
        user = await create_test_user(name="User", email="user@notifm2.com", roles="process_leader")
        token = make_token(user, active_role="process_leader")

        resp = await client.put("/api/notifications/9999/read", headers=auth_headers(token))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_mark_as_read_forbidden(self, client):
        user1 = await create_test_user(name="User1", email="user1@notifm.com", roles="process_leader")
        user2 = await create_test_user(name="User2", email="user2@notifm.com", roles="process_leader")
        notif = await _create_notification(user1["id"])
        token = make_token(user2, active_role="process_leader")

        resp = await client.put(f"/api/notifications/{notif['id']}/read", headers=auth_headers(token))
        assert resp.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# PUT /api/notifications/read-all
# ──────────────────────────────────────────────────────────────────────────────

class TestMarkAllAsRead:

    @pytest.mark.asyncio
    async def test_mark_all_as_read(self, client):
        user = await create_test_user(name="User", email="user@notifma.com", roles="process_leader")
        await _create_notification(user["id"])
        await _create_notification(user["id"])
        token = make_token(user, active_role="process_leader")

        resp = await client.put("/api/notifications/read-all", headers=auth_headers(token))
        assert resp.status_code == 200
        assert "count" in resp.json()


# ──────────────────────────────────────────────────────────────────────────────
# DELETE /api/notifications/{id}
# ──────────────────────────────────────────────────────────────────────────────

class TestDeleteNotification:

    @pytest.mark.asyncio
    async def test_delete_own_notification(self, client):
        user = await create_test_user(name="User", email="user@notifd.com", roles="process_leader")
        notif = await _create_notification(user["id"])
        token = make_token(user, active_role="process_leader")

        resp = await client.delete(f"/api/notifications/{notif['id']}", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_not_found(self, client):
        user = await create_test_user(name="User", email="user@notifd2.com", roles="process_leader")
        token = make_token(user, active_role="process_leader")

        resp = await client.delete("/api/notifications/9999", headers=auth_headers(token))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_forbidden(self, client):
        user1 = await create_test_user(name="User1", email="user1@notifd.com", roles="process_leader")
        user2 = await create_test_user(name="User2", email="user2@notifd.com", roles="process_leader")
        notif = await _create_notification(user1["id"])
        token = make_token(user2, active_role="process_leader")

        resp = await client.delete(f"/api/notifications/{notif['id']}", headers=auth_headers(token))
        assert resp.status_code == 403
