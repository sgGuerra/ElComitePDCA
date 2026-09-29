"""
Tests para los endpoints de auditoría (audit.py).
Cubre solicitud de auditoría, informes CRUD y permisos.
"""

import pytest
import pytest_asyncio

from tests.conftest import (
    create_test_user,
    create_test_process,
    make_token,
    auth_headers,
    _test_execute,
    _test_insert,
    _test_get_one,
)


# ──────────────────────────────────────────────────────────────────────────────
# POST /api/audit/processes/{id}/request-audit
# ──────────────────────────────────────────────────────────────────────────────

class TestRequestAudit:

    @pytest.mark.asyncio
    async def test_admin_requests_audit(self, client):
        admin = await create_test_user(name="Admin", email="admin@aud.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        token = make_token(admin, active_role="admin")

        resp = await client.post(
            f"/api/audit/processes/{process['id']}/request-audit",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "pending_audit"

    @pytest.mark.asyncio
    async def test_request_audit_process_not_found(self, client):
        admin = await create_test_user(name="Admin", email="admin@aud2.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.post(
            "/api/audit/processes/9999/request-audit",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_non_admin_cannot_request_audit(self, client):
        leader = await create_test_user(name="Líder", email="lider@aud.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=leader["id"], leader_id=leader["id"])
        token = make_token(leader, active_role="process_leader")

        resp = await client.post(
            f"/api/audit/processes/{process['id']}/request-audit",
            headers=auth_headers(token),
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_admin_requests_audit_notifies_auditors(self, client):
        admin = await create_test_user(name="Admin", email="admin@aud3.com", roles="admin")
        auditor = await create_test_user(name="Auditor", email="auditor@aud.com", roles="auditor")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        token = make_token(admin, active_role="admin")

        resp = await client.post(
            f"/api/audit/processes/{process['id']}/request-audit",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200

        # Verify notification was created
        notif = await _test_get_one(
            "SELECT * FROM notifications WHERE user_id = ? AND related_type = 'process'",
            (auditor["id"],)
        )
        assert notif is not None


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/audit/processes-for-review
# ──────────────────────────────────────────────────────────────────────────────

class TestProcessesForReview:

    @pytest.mark.asyncio
    async def test_auditor_lists_pending_processes(self, client):
        admin = await create_test_user(name="Admin", email="admin@aud4.com", roles="admin")
        auditor = await create_test_user(name="Auditor", email="auditor@aud2.com", roles="auditor")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        await _test_execute("UPDATE processes SET status = 'pending_audit' WHERE id = ?", (process["id"],))
        token = make_token(auditor, active_role="auditor")

        resp = await client.get("/api/audit/processes-for-review", headers=auth_headers(token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    @pytest.mark.asyncio
    async def test_non_auditor_forbidden(self, client):
        leader = await create_test_user(name="Líder", email="lider@aud2.com", roles="process_leader")
        token = make_token(leader, active_role="process_leader")

        resp = await client.get("/api/audit/processes-for-review", headers=auth_headers(token))
        assert resp.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# POST /api/audit/reports
# ──────────────────────────────────────────────────────────────────────────────

class TestCreateAuditReport:

    @pytest.mark.asyncio
    async def test_auditor_creates_report(self, client):
        admin = await create_test_user(name="Admin", email="admin@aud5.com", roles="admin")
        auditor = await create_test_user(name="Auditor", email="auditor@aud3.com", roles="auditor")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        token = make_token(auditor, active_role="auditor")

        resp = await client.post("/api/audit/reports", json={
            "title": "Informe de Auditoría",
            "content": "Contenido del informe",
            "process_id": process["id"],
        }, headers=auth_headers(token))
        assert resp.status_code == 200
        assert resp.json()["title"] == "Informe de Auditoría"

    @pytest.mark.asyncio
    async def test_non_auditor_cannot_create_report(self, client):
        leader = await create_test_user(name="Líder", email="lider@aud3.com", roles="process_leader")
        token = make_token(leader, active_role="process_leader")

        resp = await client.post("/api/audit/reports", json={
            "title": "No debería",
            "content": "Nada",
        }, headers=auth_headers(token))
        assert resp.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/audit/reports
# ──────────────────────────────────────────────────────────────────────────────

class TestListAuditReports:

    @pytest.mark.asyncio
    async def test_admin_lists_all_reports(self, client):
        admin = await create_test_user(name="Admin", email="admin@aud6.com", roles="admin")
        auditor = await create_test_user(name="Auditor", email="auditor@aud4.com", roles="auditor")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        await _test_insert(
            "INSERT INTO audit_reports (title, content, process_id, auditor_id, status) VALUES (?, ?, ?, ?, ?)",
            ("Informe", "Contenido", process["id"], auditor["id"], "draft")
        )
        token = make_token(admin, active_role="admin")

        resp = await client.get("/api/audit/reports", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_auditor_lists_own_reports(self, client):
        admin = await create_test_user(name="Admin", email="admin@aud7.com", roles="admin")
        auditor = await create_test_user(name="Auditor", email="auditor@aud5.com", roles="auditor")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        await _test_insert(
            "INSERT INTO audit_reports (title, content, process_id, auditor_id, status) VALUES (?, ?, ?, ?, ?)",
            ("Mi Informe", "Contenido", process["id"], auditor["id"], "draft")
        )
        token = make_token(auditor, active_role="auditor")

        resp = await client.get("/api/audit/reports", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_filter_by_process(self, client):
        admin = await create_test_user(name="Admin", email="admin@aud8.com", roles="admin")
        auditor = await create_test_user(name="Auditor", email="auditor@aud6.com", roles="auditor")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        await _test_insert(
            "INSERT INTO audit_reports (title, content, process_id, auditor_id, status) VALUES (?, ?, ?, ?, ?)",
            ("Informe Filtrado", "Contenido", process["id"], auditor["id"], "draft")
        )
        token = make_token(admin, active_role="admin")

        resp = await client.get(f"/api/audit/reports?process_id={process['id']}", headers=auth_headers(token))
        assert resp.status_code == 200


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/audit/reports/{id}
# ──────────────────────────────────────────────────────────────────────────────

class TestReadAuditReport:

    @pytest.mark.asyncio
    async def test_admin_reads_report(self, client):
        admin = await create_test_user(name="Admin", email="admin@aud9.com", roles="admin")
        auditor = await create_test_user(name="Auditor", email="auditor@aud7.com", roles="auditor")
        report_id = await _test_insert(
            "INSERT INTO audit_reports (title, content, auditor_id, status) VALUES (?, ?, ?, ?)",
            ("Informe", "Contenido", auditor["id"], "draft")
        )
        token = make_token(admin, active_role="admin")

        resp = await client.get(f"/api/audit/reports/{report_id}", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_auditor_reads_own_report(self, client):
        auditor = await create_test_user(name="Auditor", email="auditor@aud8.com", roles="auditor")
        report_id = await _test_insert(
            "INSERT INTO audit_reports (title, content, auditor_id, status) VALUES (?, ?, ?, ?)",
            ("Mi Informe", "Contenido", auditor["id"], "draft")
        )
        token = make_token(auditor, active_role="auditor")

        resp = await client.get(f"/api/audit/reports/{report_id}", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_report_not_found(self, client):
        admin = await create_test_user(name="Admin", email="admin@aud10.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.get("/api/audit/reports/9999", headers=auth_headers(token))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_other_auditor_forbidden(self, client):
        auditor1 = await create_test_user(name="Auditor1", email="aud1@aud.com", roles="auditor")
        auditor2 = await create_test_user(name="Auditor2", email="aud2@aud.com", roles="auditor")
        report_id = await _test_insert(
            "INSERT INTO audit_reports (title, content, auditor_id, status) VALUES (?, ?, ?, ?)",
            ("Informe de otro", "Contenido", auditor1["id"], "draft")
        )
        token = make_token(auditor2, active_role="auditor")

        resp = await client.get(f"/api/audit/reports/{report_id}", headers=auth_headers(token))
        assert resp.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# PUT /api/audit/reports/{id}
# ──────────────────────────────────────────────────────────────────────────────

class TestUpdateAuditReport:

    @pytest.mark.asyncio
    async def test_auditor_updates_own_report(self, client):
        auditor = await create_test_user(name="Auditor", email="auditor@aud9.com", roles="auditor")
        report_id = await _test_insert(
            "INSERT INTO audit_reports (title, content, auditor_id, status) VALUES (?, ?, ?, ?)",
            ("Informe", "Contenido", auditor["id"], "draft")
        )
        token = make_token(auditor, active_role="auditor")

        resp = await client.put(f"/api/audit/reports/{report_id}", json={
            "title": "Informe Actualizado",
            "content": "Nuevo contenido",
        }, headers=auth_headers(token))
        assert resp.status_code == 200
        assert resp.json()["title"] == "Informe Actualizado"

    @pytest.mark.asyncio
    async def test_update_report_not_found(self, client):
        auditor = await create_test_user(name="Auditor", email="auditor@aud10.com", roles="auditor")
        token = make_token(auditor, active_role="auditor")

        resp = await client.put("/api/audit/reports/9999", json={
            "title": "X",
        }, headers=auth_headers(token))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_other_auditor_forbidden_on_update(self, client):
        auditor1 = await create_test_user(name="Auditor1", email="aud1@upd.com", roles="auditor")
        auditor2 = await create_test_user(name="Auditor2", email="aud2@upd.com", roles="auditor")
        report_id = await _test_insert(
            "INSERT INTO audit_reports (title, content, auditor_id, status) VALUES (?, ?, ?, ?)",
            ("Informe", "Contenido", auditor1["id"], "draft")
        )
        token = make_token(auditor2, active_role="auditor")

        resp = await client.put(f"/api/audit/reports/{report_id}", json={
            "title": "No permiso",
        }, headers=auth_headers(token))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_non_auditor_forbidden(self, client):
        leader = await create_test_user(name="Líder", email="lider@updrep.com", roles="process_leader")
        auditor = await create_test_user(name="Auditor", email="auditor@updrep.com", roles="auditor")
        report_id = await _test_insert(
            "INSERT INTO audit_reports (title, content, auditor_id, status) VALUES (?, ?, ?, ?)",
            ("Informe", "Contenido", auditor["id"], "draft")
        )
        token = make_token(leader, active_role="process_leader")

        resp = await client.put(f"/api/audit/reports/{report_id}", json={
            "title": "No permiso",
        }, headers=auth_headers(token))
        assert resp.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# DELETE /api/audit/reports/{id}
# ──────────────────────────────────────────────────────────────────────────────

class TestDeleteAuditReport:

    @pytest.mark.asyncio
    async def test_auditor_deletes_own_report(self, client):
        auditor = await create_test_user(name="Auditor", email="auditor@aud11.com", roles="auditor")
        report_id = await _test_insert(
            "INSERT INTO audit_reports (title, content, auditor_id, status) VALUES (?, ?, ?, ?)",
            ("Informe", "Contenido", auditor["id"], "draft")
        )
        token = make_token(auditor, active_role="auditor")

        resp = await client.delete(f"/api/audit/reports/{report_id}", headers=auth_headers(token))
        assert resp.status_code == 204

    @pytest.mark.asyncio
    async def test_admin_deletes_any_report(self, client):
        admin = await create_test_user(name="Admin", email="admin@aud11.com", roles="admin")
        auditor = await create_test_user(name="Auditor", email="auditor@aud12.com", roles="auditor")
        report_id = await _test_insert(
            "INSERT INTO audit_reports (title, content, auditor_id, status) VALUES (?, ?, ?, ?)",
            ("Informe", "Contenido", auditor["id"], "draft")
        )
        token = make_token(admin, active_role="admin")

        resp = await client.delete(f"/api/audit/reports/{report_id}", headers=auth_headers(token))
        assert resp.status_code == 204

    @pytest.mark.asyncio
    async def test_delete_report_not_found(self, client):
        admin = await create_test_user(name="Admin", email="admin@aud12.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.delete("/api/audit/reports/9999", headers=auth_headers(token))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_other_auditor_forbidden_on_delete(self, client):
        auditor1 = await create_test_user(name="Auditor1", email="aud1@del.com", roles="auditor")
        auditor2 = await create_test_user(name="Auditor2", email="aud2@del.com", roles="auditor")
        report_id = await _test_insert(
            "INSERT INTO audit_reports (title, content, auditor_id, status) VALUES (?, ?, ?, ?)",
            ("Informe", "Contenido", auditor1["id"], "draft")
        )
        token = make_token(auditor2, active_role="auditor")

        resp = await client.delete(f"/api/audit/reports/{report_id}", headers=auth_headers(token))
        assert resp.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/audit/reports/{id}/download
# ──────────────────────────────────────────────────────────────────────────────

class TestDownloadAuditReport:

    @pytest.mark.asyncio
    async def test_download_no_file(self, client):
        auditor = await create_test_user(name="Auditor", email="auditor@aud13.com", roles="auditor")
        report_id = await _test_insert(
            "INSERT INTO audit_reports (title, content, auditor_id, status) VALUES (?, ?, ?, ?)",
            ("Informe", "Contenido", auditor["id"], "draft")
        )
        token = make_token(auditor, active_role="auditor")

        resp = await client.get(f"/api/audit/reports/{report_id}/download", headers=auth_headers(token))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_download_with_file(self, client):
        auditor = await create_test_user(name="Auditor", email="auditor@aud14.com", roles="auditor")
        report_id = await _test_insert(
            "INSERT INTO audit_reports (title, content, auditor_id, file_path, status) VALUES (?, ?, ?, ?, ?)",
            ("Informe", "Contenido", auditor["id"], "/path/to/file.pdf", "draft")
        )
        token = make_token(auditor, active_role="auditor")

        resp = await client.get(f"/api/audit/reports/{report_id}/download", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_download_not_found(self, client):
        admin = await create_test_user(name="Admin", email="admin@aud13.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.get("/api/audit/reports/9999/download", headers=auth_headers(token))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_download_forbidden(self, client):
        auditor1 = await create_test_user(name="Auditor1", email="aud1@dl.com", roles="auditor")
        auditor2 = await create_test_user(name="Auditor2", email="aud2@dl.com", roles="auditor")
        report_id = await _test_insert(
            "INSERT INTO audit_reports (title, content, auditor_id, status) VALUES (?, ?, ?, ?)",
            ("Informe", "Contenido", auditor1["id"], "draft")
        )
        token = make_token(auditor2, active_role="auditor")

        resp = await client.get(f"/api/audit/reports/{report_id}/download", headers=auth_headers(token))
        assert resp.status_code == 403
