"""
Tests para los endpoints de procesos (processes.py).
Cubre CRUD, permisos, estadísticas y líderes.
"""

import pytest
import pytest_asyncio

from tests.conftest import (
    create_test_user,
    create_test_process,
    create_test_action,
    assign_leader_to_process,
    make_token,
    auth_headers,
)


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/processes/
# ──────────────────────────────────────────────────────────────────────────────

class TestListProcesses:

    @pytest.mark.asyncio
    async def test_admin_sees_all_processes(self, client):
        admin = await create_test_user(name="Admin", email="admin@proc.com", roles="admin")
        await create_test_process(name="Proc 1", created_by=admin["id"], leader_id=admin["id"])
        await create_test_process(name="Proc 2", created_by=admin["id"], leader_id=admin["id"])
        token = make_token(admin, active_role="admin")

        resp = await client.get("/api/processes/", headers=auth_headers(token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 2

    @pytest.mark.asyncio
    async def test_admin_sees_all_with_stats(self, client):
        admin = await create_test_user(name="Admin", email="admin@procst.com", roles="admin")
        process = await create_test_process(name="Proc Stats", created_by=admin["id"], leader_id=admin["id"])
        await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])
        token = make_token(admin, active_role="admin")

        resp = await client.get("/api/processes/?stats=true", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_leader_sees_assigned_processes(self, client):
        admin = await create_test_user(name="Admin", email="admin@proc2.com", roles="admin")
        leader = await create_test_user(name="Líder", email="lider@proc.com", roles="process_leader")
        process = await create_test_process(name="Proc Asignado", created_by=admin["id"], leader_id=leader["id"])
        await assign_leader_to_process(process["id"], leader["id"], admin["id"])
        token = make_token(leader, active_role="process_leader")

        resp = await client.get("/api/processes/", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_leader_with_stats(self, client):
        admin = await create_test_user(name="Admin", email="admin@proc2s.com", roles="admin")
        leader = await create_test_user(name="Líder", email="lider@procs.com", roles="process_leader")
        process = await create_test_process(name="Proc Asignado", created_by=admin["id"], leader_id=leader["id"])
        await assign_leader_to_process(process["id"], leader["id"], admin["id"])
        await create_test_action(process_id=process["id"], leader_id=leader["id"], created_by=admin["id"])
        token = make_token(leader, active_role="process_leader")

        resp = await client.get("/api/processes/?stats=true", headers=auth_headers(token))
        assert resp.status_code == 200


# ──────────────────────────────────────────────────────────────────────────────
# POST /api/processes/
# ──────────────────────────────────────────────────────────────────────────────

class TestCreateProcess:

    @pytest.mark.asyncio
    async def test_admin_creates_process(self, client):
        admin = await create_test_user(name="Admin", email="admin@cproc.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.post("/api/processes/", json={
            "name": "Nuevo Proceso",
            "description": "Descripción del proceso",
        }, headers=auth_headers(token))
        assert resp.status_code == 200
        assert resp.json()["name"] == "Nuevo Proceso"

    @pytest.mark.asyncio
    async def test_admin_creates_with_leader(self, client):
        admin = await create_test_user(name="Admin", email="admin@cproc2.com", roles="admin")
        leader = await create_test_user(name="Líder", email="lider@cproc.com", roles="process_leader")
        token = make_token(admin, active_role="admin")

        resp = await client.post("/api/processes/", json={
            "name": "Proceso con líder",
            "description": "Desc",
            "leader_id": leader["id"],
        }, headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_non_admin_cannot_create(self, client):
        leader = await create_test_user(name="Líder", email="lider@cproc2.com", roles="process_leader")
        token = make_token(leader, active_role="process_leader")

        resp = await client.post("/api/processes/", json={
            "name": "No debería",
        }, headers=auth_headers(token))
        assert resp.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/processes/{id}
# ──────────────────────────────────────────────────────────────────────────────

class TestReadProcess:

    @pytest.mark.asyncio
    async def test_admin_reads_process(self, client):
        admin = await create_test_user(name="Admin", email="admin@rproc.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        token = make_token(admin, active_role="admin")

        resp = await client.get(f"/api/processes/{process['id']}", headers=auth_headers(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "total_actions" in data

    @pytest.mark.asyncio
    async def test_creator_reads_own_process(self, client):
        leader = await create_test_user(name="Líder", email="lider@rproc.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=leader["id"], leader_id=leader["id"])
        token = make_token(leader, active_role="process_leader")

        resp = await client.get(f"/api/processes/{process['id']}", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_assigned_leader_reads_process(self, client):
        admin = await create_test_user(name="Admin", email="admin@rproc2.com", roles="admin")
        leader = await create_test_user(name="Líder", email="lider@rproc2.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=leader["id"])
        await assign_leader_to_process(process["id"], leader["id"], admin["id"])
        token = make_token(leader, active_role="process_leader")

        resp = await client.get(f"/api/processes/{process['id']}", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_auditor_reads_pending_audit_process(self, client):
        from tests.conftest import _test_insert
        admin = await create_test_user(name="Admin", email="admin@rproc3.com", roles="admin")
        auditor = await create_test_user(name="Auditor", email="auditor@rproc.com", roles="auditor")
        process = await create_test_process(name="Proc Audit", created_by=admin["id"], leader_id=admin["id"])
        # Set process to pending_audit
        from tests.conftest import _test_execute
        await _test_execute("UPDATE processes SET status = 'pending_audit' WHERE id = ?", (process["id"],))
        token = make_token(auditor, active_role="auditor")

        resp = await client.get(f"/api/processes/{process['id']}", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_process_not_found(self, client):
        admin = await create_test_user(name="Admin", email="admin@rproc4.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.get("/api/processes/9999", headers=auth_headers(token))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_forbidden_for_unrelated_user(self, client):
        admin = await create_test_user(name="Admin", email="admin@rproc5.com", roles="admin")
        other = await create_test_user(name="Otro", email="otro@rproc.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        token = make_token(other, active_role="process_leader")

        resp = await client.get(f"/api/processes/{process['id']}", headers=auth_headers(token))
        assert resp.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# PUT /api/processes/{id}
# ──────────────────────────────────────────────────────────────────────────────

class TestUpdateProcess:

    @pytest.mark.asyncio
    async def test_admin_updates_process(self, client):
        admin = await create_test_user(name="Admin", email="admin@uproc.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        token = make_token(admin, active_role="admin")

        resp = await client.put(f"/api/processes/{process['id']}", json={
            "name": "Nombre Actualizado",
        }, headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_creator_updates_process(self, client):
        leader = await create_test_user(name="Líder", email="lider@uproc.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=leader["id"], leader_id=leader["id"])
        token = make_token(leader, active_role="process_leader")

        resp = await client.put(f"/api/processes/{process['id']}", json={
            "description": "Nueva desc",
        }, headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_non_owner_forbidden_on_update(self, client):
        admin = await create_test_user(name="Admin", email="admin@uproc2.com", roles="admin")
        other = await create_test_user(name="Otro", email="otro@uproc.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        token = make_token(other, active_role="process_leader")

        resp = await client.put(f"/api/processes/{process['id']}", json={
            "name": "No permiso",
        }, headers=auth_headers(token))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_process_not_found_on_update(self, client):
        admin = await create_test_user(name="Admin", email="admin@uproc3.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.put("/api/processes/9999", json={"name": "X"}, headers=auth_headers(token))
        assert resp.status_code == 404


# ──────────────────────────────────────────────────────────────────────────────
# DELETE /api/processes/{id}
# ──────────────────────────────────────────────────────────────────────────────

class TestDeleteProcess:

    @pytest.mark.asyncio
    async def test_admin_deletes_process(self, client):
        admin = await create_test_user(name="Admin", email="admin@dproc.com", roles="admin")
        process = await create_test_process(name="A eliminar", created_by=admin["id"], leader_id=admin["id"])
        token = make_token(admin, active_role="admin")

        resp = await client.delete(f"/api/processes/{process['id']}", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_non_admin_cannot_delete(self, client):
        admin = await create_test_user(name="Admin", email="admin@dproc2.com", roles="admin")
        leader = await create_test_user(name="Líder", email="lider@dproc.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        token = make_token(leader, active_role="process_leader")

        resp = await client.delete(f"/api/processes/{process['id']}", headers=auth_headers(token))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_process_not_found_on_delete(self, client):
        admin = await create_test_user(name="Admin", email="admin@dproc3.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.delete("/api/processes/9999", headers=auth_headers(token))
        assert resp.status_code == 404


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/processes/{id}/leaders
# ──────────────────────────────────────────────────────────────────────────────

class TestProcessLeaders:

    @pytest.mark.asyncio
    async def test_get_process_leaders(self, client):
        admin = await create_test_user(name="Admin", email="admin@plead.com", roles="admin")
        leader = await create_test_user(name="Líder", email="lider@plead.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=leader["id"])
        await assign_leader_to_process(process["id"], leader["id"], admin["id"])
        token = make_token(admin, active_role="admin")

        resp = await client.get(f"/api/processes/{process['id']}/leaders", headers=auth_headers(token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    @pytest.mark.asyncio
    async def test_leaders_process_not_found(self, client):
        admin = await create_test_user(name="Admin", email="admin@plead2.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.get("/api/processes/9999/leaders", headers=auth_headers(token))
        assert resp.status_code == 404


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/processes/{id}/statistics
# ──────────────────────────────────────────────────────────────────────────────

class TestProcessStatistics:

    @pytest.mark.asyncio
    async def test_get_process_statistics(self, client):
        admin = await create_test_user(name="Admin", email="admin@pstat.com", roles="admin")
        process = await create_test_process(name="Proc Stats", created_by=admin["id"], leader_id=admin["id"])
        await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"], status="completed")
        await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"], status="pending")
        token = make_token(admin, active_role="admin")

        resp = await client.get(f"/api/processes/{process['id']}/statistics", headers=auth_headers(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "total_actions" in data
        assert "actions_by_status" in data

    @pytest.mark.asyncio
    async def test_statistics_process_not_found(self, client):
        admin = await create_test_user(name="Admin", email="admin@pstat2.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.get("/api/processes/9999/statistics", headers=auth_headers(token))
        assert resp.status_code == 404
