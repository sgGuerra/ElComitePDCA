import pytest
from assertpy import assert_that

from tests.conftest import auth_headers, create_test_user, make_token, _test_insert


class TestNotificationHistory:
    @pytest.mark.asyncio
    async def test_authenticated_user_sees_only_own_notifications(self, client):
        user = await create_test_user(
            name="Usuario RF13", email="rf13-user@test.com", roles="process_leader"
        )
        other_user = await create_test_user(
            name="Otro RF13", email="rf13-other@test.com", roles="process_leader"
        )
        await _test_insert(
            "INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)",
            (user["id"], "Notificación propia", "Mensaje propio"),
        )
        await _test_insert(
            "INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)",
            (other_user["id"], "Notificación ajena", "Mensaje ajeno"),
        )
        headers = auth_headers(make_token(user, active_role="process_leader"))

        response = await client.get("/api/notifications/", headers=headers)
        titles = [item["title"] for item in response.json()]

        assert_that(response.status_code).is_equal_to(200)
        assert_that(titles).contains("Notificación propia")
        assert_that(titles).does_not_contain("Notificación ajena")

    @pytest.mark.asyncio
    async def test_user_without_notifications_gets_empty_list(self, client):
        user = await create_test_user(
            name="Usuario vacío RF13", email="rf13-empty@test.com", roles="process_leader"
        )
        headers = auth_headers(make_token(user, active_role="process_leader"))

        response = await client.get("/api/notifications/", headers=headers)

        assert_that(response.status_code).is_equal_to(200)
        assert_that(response.json()).is_empty()