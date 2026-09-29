from datetime import datetime

import pytest
from assertpy import assert_that

from tests.conftest import (
    auth_headers,
    create_test_process,
    create_test_user,
    make_token,
)


class TestAuditLogExport:
    @pytest.mark.asyncio
    async def test_admin_exports_filtered_logs_as_pdf(self, client):
        admin = await create_test_user(
            name="Admin RF16", email="rf16-pdf@test.com", roles="admin"
        )
        process = await create_test_process(
            name="Proceso exportable", created_by=admin["id"], leader_id=admin["id"]
        )
        headers = auth_headers(make_token(admin, active_role="admin"))
        action = await client.post(
            "/api/actions/",
            json={
                "name": "Acción exportable",
                "process_id": process["id"],
                "leader_id": admin["id"],
                "priority": "high",
            },
            headers=headers,
        )
        assert_that(action.status_code).is_equal_to(200)

        exported = await client.get(
            "/api/audit/export/pdf",
            params={"entity_type": "action", "entity_id": action.json()["id"]},
            headers=headers,
        )

        assert_that(exported.status_code).is_equal_to(200)
        assert_that(exported.headers["content-type"]).contains("application/pdf")
        assert_that(exported.content[:4]).is_equal_to(b"%PDF")

    @pytest.mark.asyncio
    async def test_admin_exports_logs_as_excel(self, client):
        admin = await create_test_user(
            name="Admin RF16", email="rf16-excel@test.com", roles="admin"
        )
        process = await create_test_process(
            name="Proceso Excel", created_by=admin["id"], leader_id=admin["id"]
        )
        headers = auth_headers(make_token(admin, active_role="admin"))
        await client.post(
            "/api/actions/",
            json={
                "name": "Acción Excel",
                "process_id": process["id"],
                "leader_id": admin["id"],
            },
            headers=headers,
        )

        exported = await client.get("/api/audit/export/excel", headers=headers)

        assert_that(exported.status_code).is_equal_to(200)
        assert_that(exported.headers["content-type"]).contains("spreadsheetml.sheet")
        assert_that(exported.content[:2]).is_equal_to(b"PK")

    @pytest.mark.asyncio
    async def test_filters_by_entity_user_and_date(self, client):
        admin = await create_test_user(
            name="Admin RF16", email="rf16-filter@test.com", roles="admin"
        )
        process = await create_test_process(
            name="Proceso filtrado", created_by=admin["id"], leader_id=admin["id"]
        )
        headers = auth_headers(make_token(admin, active_role="admin"))
        action = await client.post(
            "/api/actions/",
            json={
                "name": "Acción filtrada",
                "process_id": process["id"],
                "leader_id": admin["id"],
            },
            headers=headers,
        )
        unfiltered = await client.get("/api/audit/", headers=headers)
        assert_that(unfiltered.json()["total"]).is_greater_than(0)
        newest_log = unfiltered.json()["data"][0]
        assert_that(newest_log["entity_type"]).is_equal_to("action")
        assert_that(newest_log["entity_id"]).is_equal_to(action.json()["id"])
        assert_that(newest_log["user_id"]).is_equal_to(admin["id"])
        event_date = datetime.fromisoformat(newest_log["created_at"]).date().isoformat()
        params = {
            "entity_type": "action",
            "entity_id": action.json()["id"],
            "user_id": admin["id"],
            "start_date": event_date,
            "end_date": event_date,
        }

        response = await client.get("/api/audit/", params=params, headers=headers)

        assert_that(response.status_code).is_equal_to(200)
        assert_that(response.json()["total"]).is_equal_to(1)
        assert_that(response.json()["data"][0]["entity_type"]).is_equal_to("action")
        assert_that(response.json()["data"][0]["entity_id"]).is_equal_to(action.json()["id"])

    @pytest.mark.asyncio
    async def test_rejects_unknown_export_format_and_non_admin(self, client):
        admin = await create_test_user(
            name="Admin RF16", email="rf16-invalid@test.com", roles="admin"
        )
        leader = await create_test_user(
            name="Líder RF16", email="rf16-leader@test.com", roles="process_leader"
        )
        admin_headers = auth_headers(make_token(admin, active_role="admin"))
        leader_headers = auth_headers(make_token(leader, active_role="process_leader"))

        invalid = await client.get("/api/audit/export/doc", headers=admin_headers)
        forbidden = await client.get("/api/audit/export/pdf", headers=leader_headers)

        assert_that(invalid.status_code).is_equal_to(422)
        assert_that(forbidden.status_code).is_equal_to(403)