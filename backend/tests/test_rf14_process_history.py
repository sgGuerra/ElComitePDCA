import pytest
from assertpy import assert_that

from tests.conftest import auth_headers, create_test_process, create_test_user, make_token


class TestAdminProcessHistory:
    @pytest.mark.asyncio
    async def test_admin_lists_all_processes_with_status(self, client):
        admin = await create_test_user(
            name="Admin RF14", email="rf14-admin@test.com", roles="admin"
        )
        first = await create_test_process(
            name="Proceso activo RF14", created_by=admin["id"], leader_id=admin["id"]
        )
        second = await create_test_process(
            name="Proceso pendiente RF14", created_by=admin["id"], leader_id=admin["id"]
        )
        await client.put(
            f"/api/processes/{second['id']}",
            json={"status": "pending"},
            headers=auth_headers(make_token(admin, active_role="admin")),
        )
        headers = auth_headers(make_token(admin, active_role="admin"))

        response = await client.get("/api/processes/", headers=headers)
        process_by_id = {item["id"]: item for item in response.json()}

        assert_that(response.status_code).is_equal_to(200)
        assert_that(process_by_id).contains_key(first["id"], second["id"])
        assert_that(process_by_id[first["id"]]["status"]).is_equal_to("active")
        assert_that(process_by_id[second["id"]]["status"]).is_equal_to("pending")

    @pytest.mark.asyncio
    async def test_unauthenticated_user_cannot_read_process_history(self, client):
        response = await client.get("/api/processes/")

        assert_that(response.status_code).is_equal_to(401)