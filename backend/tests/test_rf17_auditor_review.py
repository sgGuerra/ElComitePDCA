import pytest
from assertpy import assert_that

from tests.conftest import auth_headers, create_test_process, create_test_user, make_token


class TestAuditorHistoryReview:
    @pytest.mark.asyncio
    async def test_auditor_lists_processes_pending_review(self, client):
        admin = await create_test_user(
            name="Admin RF17", email="rf17-admin@test.com", roles="admin"
        )
        auditor = await create_test_user(
            name="Auditor RF17", email="rf17-auditor@test.com", roles="auditor"
        )
        process = await create_test_process(
            name="Proceso pendiente RF17", created_by=admin["id"], leader_id=admin["id"]
        )
        admin_headers = auth_headers(make_token(admin, active_role="admin"))
        await client.post(
            f"/api/audit/processes/{process['id']}/request-audit",
            headers=admin_headers,
        )
        auditor_headers = auth_headers(make_token(auditor, active_role="auditor"))

        response = await client.get(
            "/api/audit/processes-for-review",
            headers=auditor_headers,
        )

        assert_that(response.status_code).is_equal_to(200)
        assert_that([item["id"] for item in response.json()]).contains(process["id"])

    @pytest.mark.asyncio
    async def test_non_auditor_cannot_list_review_processes(self, client):
        leader = await create_test_user(
            name="Líder RF17", email="rf17-leader@test.com", roles="process_leader"
        )
        headers = auth_headers(make_token(leader, active_role="process_leader"))

        response = await client.get("/api/audit/processes-for-review", headers=headers)

        assert_that(response.status_code).is_equal_to(403)

    @pytest.mark.asyncio
    async def test_auditor_creates_and_reads_own_report(self, client):
        auditor = await create_test_user(
            name="Auditor RF17", email="rf17-report@test.com", roles="auditor"
        )
        headers = auth_headers(make_token(auditor, active_role="auditor"))

        created = await client.post(
            "/api/audit/reports",
            json={"title": "Informe RF17", "content": "Hallazgos revisados"},
            headers=headers,
        )

        assert_that(created.status_code).is_equal_to(200)
        assert_that(created.json()["auditor_id"]).is_equal_to(auditor["id"])
        report_id = created.json()["id"]
        read = await client.get(f"/api/audit/reports/{report_id}", headers=headers)
        assert_that(read.status_code).is_equal_to(200)
        assert_that(read.json()["title"]).is_equal_to("Informe RF17")