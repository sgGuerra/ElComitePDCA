"""
Tests para los endpoints de acciones (actions.py).
Cubre CRUD, permisos, estadísticas, deadlines y archivos.
"""

import pytest
import pytest_asyncio

from tests.conftest import (
    create_test_user,
    create_test_process,
    create_test_action,
    make_token,
    auth_headers,
    _test_insert,
    _test_get_one,
)


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/actions/process/{process_id}
# ──────────────────────────────────────────────────────────────────────────────

class TestReadActionsByProcess:

    @pytest.mark.asyncio
    async def test_admin_can_list_process_actions(self, client):
        admin = await create_test_user(name="Admin", email="admin@act.com", roles="admin")
        process = await create_test_process(name="Proc A", created_by=admin["id"], leader_id=admin["id"])
        await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"], name="Acción 1")
        token = make_token(admin, active_role="admin")

        resp = await client.get(f"/api/actions/process/{process['id']}", headers=auth_headers(token))
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    @pytest.mark.asyncio
    async def test_creator_can_list_own_process_actions(self, client):
        leader = await create_test_user(name="Líder", email="lider@act.com", roles="process_leader")
        process = await create_test_process(name="Proc B", created_by=leader["id"], leader_id=leader["id"])
        await create_test_action(process_id=process["id"], leader_id=leader["id"], created_by=leader["id"])
        token = make_token(leader, active_role="process_leader")

        resp = await client.get(f"/api/actions/process/{process['id']}", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_non_owner_forbidden(self, client):
        admin = await create_test_user(name="Admin", email="admin@act2.com", roles="admin")
        other = await create_test_user(name="Otro", email="otro@act.com", roles="process_leader")
        process = await create_test_process(name="Proc C", created_by=admin["id"], leader_id=admin["id"])
        token = make_token(other, active_role="process_leader")

        resp = await client.get(f"/api/actions/process/{process['id']}", headers=auth_headers(token))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_process_not_found(self, client):
        admin = await create_test_user(name="Admin", email="admin@act3.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.get("/api/actions/process/9999", headers=auth_headers(token))
        assert resp.status_code == 404


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/actions/leader/{leader_id}
# ──────────────────────────────────────────────────────────────────────────────

class TestReadActionsByLeader:

    @pytest.mark.asyncio
    async def test_leader_can_see_own_actions(self, client):
        leader = await create_test_user(name="Líder", email="lider@lead.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=leader["id"], leader_id=leader["id"])
        await create_test_action(process_id=process["id"], leader_id=leader["id"], created_by=leader["id"])
        token = make_token(leader, active_role="process_leader")

        resp = await client.get(f"/api/actions/leader/{leader['id']}", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_admin_can_see_any_leader_actions(self, client):
        admin = await create_test_user(name="Admin", email="admin@lead.com", roles="admin")
        leader = await create_test_user(name="Líder", email="lider@lead2.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=leader["id"])
        await create_test_action(process_id=process["id"], leader_id=leader["id"], created_by=admin["id"])
        token = make_token(admin, active_role="admin")

        resp = await client.get(f"/api/actions/leader/{leader['id']}", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_other_leader_forbidden(self, client):
        leader1 = await create_test_user(name="Líder1", email="l1@lead.com", roles="process_leader")
        leader2 = await create_test_user(name="Líder2", email="l2@lead.com", roles="process_leader")
        token = make_token(leader2, active_role="process_leader")

        resp = await client.get(f"/api/actions/leader/{leader1['id']}", headers=auth_headers(token))
        assert resp.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/actions/statistics
# ──────────────────────────────────────────────────────────────────────────────

class TestActionStatistics:

    @pytest.mark.asyncio
    async def test_get_global_statistics(self, client):
        admin = await create_test_user(name="Admin", email="admin@stats.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.get("/api/actions/statistics", headers=auth_headers(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "total" in data
        assert "completed" in data

    @pytest.mark.asyncio
    async def test_get_statistics_by_process(self, client):
        admin = await create_test_user(name="Admin", email="admin@stats2.com", roles="admin")
        process = await create_test_process(name="Proc Stats", created_by=admin["id"], leader_id=admin["id"])
        await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"], status="completed")
        await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"], status="pending")
        token = make_token(admin, active_role="admin")

        resp = await client.get(f"/api/actions/statistics?process_id={process['id']}", headers=auth_headers(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2

    @pytest.mark.asyncio
    async def test_statistics_process_not_found(self, client):
        admin = await create_test_user(name="Admin", email="admin@stats3.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.get("/api/actions/statistics?process_id=9999", headers=auth_headers(token))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_statistics_forbidden_for_non_owner(self, client):
        admin = await create_test_user(name="Admin", email="admin@stats4.com", roles="admin")
        other = await create_test_user(name="Otro", email="otro@stats.com", roles="process_leader")
        process = await create_test_process(name="Proc priv", created_by=admin["id"], leader_id=admin["id"])
        token = make_token(other, active_role="process_leader")

        resp = await client.get(f"/api/actions/statistics?process_id={process['id']}", headers=auth_headers(token))
        assert resp.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/actions/upcoming-deadlines
# ──────────────────────────────────────────────────────────────────────────────

class TestUpcomingDeadlines:

    @pytest.mark.asyncio
    async def test_get_upcoming_deadlines(self, client):
        admin = await create_test_user(name="Admin", email="admin@dead.com", roles="admin")
        process = await create_test_process(name="Proc DL", created_by=admin["id"], leader_id=admin["id"])
        await create_test_action(
            process_id=process["id"], leader_id=admin["id"], created_by=admin["id"],
            name="Con fecha", target_date="2099-12-31"
        )
        token = make_token(admin, active_role="admin")

        resp = await client.get("/api/actions/upcoming-deadlines", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_deadlines_filtered_by_process(self, client):
        admin = await create_test_user(name="Admin", email="admin@dead2.com", roles="admin")
        process = await create_test_process(name="Proc DL2", created_by=admin["id"], leader_id=admin["id"])
        token = make_token(admin, active_role="admin")

        resp = await client.get(
            f"/api/actions/upcoming-deadlines?process_id={process['id']}&date_range=year",
            headers=auth_headers(token)
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_deadlines_forbidden_for_non_owner(self, client):
        admin = await create_test_user(name="Admin", email="admin@dead3.com", roles="admin")
        other = await create_test_user(name="Otro", email="otro@dead.com", roles="process_leader")
        process = await create_test_process(name="Proc privDL", created_by=admin["id"], leader_id=admin["id"])
        token = make_token(other, active_role="process_leader")

        resp = await client.get(
            f"/api/actions/upcoming-deadlines?process_id={process['id']}",
            headers=auth_headers(token)
        )
        assert resp.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/actions/{action_id}
# ──────────────────────────────────────────────────────────────────────────────

class TestReadAction:

    @pytest.mark.asyncio
    async def test_admin_can_read_any_action(self, client):
        admin = await create_test_user(name="Admin", email="admin@read.com", roles="admin")
        leader = await create_test_user(name="Líder", email="lider@read.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=leader["id"])
        action = await create_test_action(process_id=process["id"], leader_id=leader["id"], created_by=admin["id"])
        token = make_token(admin, active_role="admin")

        resp = await client.get(f"/api/actions/{action['id']}", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_leader_can_read_assigned_action(self, client):
        admin = await create_test_user(name="Admin", email="admin@read2.com", roles="admin")
        leader = await create_test_user(name="Líder", email="lider@read2.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=leader["id"])
        action = await create_test_action(process_id=process["id"], leader_id=leader["id"], created_by=admin["id"])
        token = make_token(leader, active_role="process_leader")

        resp = await client.get(f"/api/actions/{action['id']}", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_action_not_found(self, client):
        admin = await create_test_user(name="Admin", email="admin@read3.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.get("/api/actions/9999", headers=auth_headers(token))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_unrelated_user_forbidden(self, client):
        admin = await create_test_user(name="Admin", email="admin@read4.com", roles="admin")
        other = await create_test_user(name="Otro", email="otro@read.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])
        token = make_token(other, active_role="process_leader")

        resp = await client.get(f"/api/actions/{action['id']}", headers=auth_headers(token))
        assert resp.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# POST /api/actions/
# ──────────────────────────────────────────────────────────────────────────────

class TestCreateAction:

    @pytest.mark.asyncio
    async def test_admin_creates_action(self, client):
        admin = await create_test_user(name="Admin", email="admin@create.com", roles="admin")
        leader = await create_test_user(name="Líder", email="lider@create.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=leader["id"])
        token = make_token(admin, active_role="admin")

        resp = await client.post("/api/actions/", json={
            "name": "Nueva acción",
            "process_id": process["id"],
            "leader_id": leader["id"],
        }, headers=auth_headers(token))
        assert resp.status_code == 200
        assert resp.json()["name"] == "Nueva acción"

    @pytest.mark.asyncio
    async def test_creator_creates_action(self, client):
        leader = await create_test_user(name="Líder", email="lider@create2.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=leader["id"], leader_id=leader["id"])
        token = make_token(leader, active_role="process_leader")

        resp = await client.post("/api/actions/", json={
            "name": "Acción del líder",
            "process_id": process["id"],
            "leader_id": leader["id"],
        }, headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_auditor_cannot_create_action(self, client):
        admin = await create_test_user(name="Admin", email="admin@create3.com", roles="admin")
        auditor = await create_test_user(name="Auditor", email="auditor@create.com", roles="auditor")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        token = make_token(auditor, active_role="auditor")

        resp = await client.post("/api/actions/", json={
            "name": "No debería",
            "process_id": process["id"],
            "leader_id": admin["id"],
        }, headers=auth_headers(token))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_process_not_found_on_create(self, client):
        admin = await create_test_user(name="Admin", email="admin@create4.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.post("/api/actions/", json={
            "name": "X",
            "process_id": 9999,
            "leader_id": admin["id"],
        }, headers=auth_headers(token))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_non_owner_non_admin_forbidden(self, client):
        admin = await create_test_user(name="Admin", email="admin@create5.com", roles="admin")
        other = await create_test_user(name="Otro", email="otro@create.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        token = make_token(other, active_role="process_leader")

        resp = await client.post("/api/actions/", json={
            "name": "No permiso",
            "process_id": process["id"],
            "leader_id": other["id"],
        }, headers=auth_headers(token))
        assert resp.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# PUT /api/actions/{action_id}
# ──────────────────────────────────────────────────────────────────────────────

class TestUpdateAction:

    @pytest.mark.asyncio
    async def test_admin_updates_action(self, client):
        admin = await create_test_user(name="Admin", email="admin@upd.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])
        token = make_token(admin, active_role="admin")

        resp = await client.put(f"/api/actions/{action['id']}", json={
            "status": "in_progress"
        }, headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_leader_can_update_allowed_fields(self, client):
        admin = await create_test_user(name="Admin", email="admin@upd2.com", roles="admin")
        leader = await create_test_user(name="Líder", email="lider@upd.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=leader["id"])
        action = await create_test_action(process_id=process["id"], leader_id=leader["id"], created_by=admin["id"])
        token = make_token(leader, active_role="process_leader")

        resp = await client.put(f"/api/actions/{action['id']}", json={
            "status": "completed",
            "completion_percentage": 100,
        }, headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_leader_cannot_update_restricted_fields(self, client):
        admin = await create_test_user(name="Admin", email="admin@upd3.com", roles="admin")
        leader = await create_test_user(name="Líder", email="lider@upd2.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=leader["id"])
        action = await create_test_action(process_id=process["id"], leader_id=leader["id"], created_by=admin["id"])
        token = make_token(leader, active_role="process_leader")

        resp = await client.put(f"/api/actions/{action['id']}", json={
            "name": "Nuevo nombre",
        }, headers=auth_headers(token))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_action_not_found_on_update(self, client):
        admin = await create_test_user(name="Admin", email="admin@upd4.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.put("/api/actions/9999", json={"status": "completed"}, headers=auth_headers(token))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_unrelated_user_forbidden_on_update(self, client):
        admin = await create_test_user(name="Admin", email="admin@upd5.com", roles="admin")
        other = await create_test_user(name="Otro", email="otro@upd.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])
        token = make_token(other, active_role="process_leader")

        resp = await client.put(f"/api/actions/{action['id']}", json={"status": "completed"}, headers=auth_headers(token))
        assert resp.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# DELETE /api/actions/{action_id}
# ──────────────────────────────────────────────────────────────────────────────

class TestDeleteAction:

    @pytest.mark.asyncio
    async def test_admin_deletes_action(self, client):
        admin = await create_test_user(name="Admin", email="admin@del.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])
        token = make_token(admin, active_role="admin")

        resp = await client.delete(f"/api/actions/{action['id']}", headers=auth_headers(token))
        assert resp.status_code == 200
        assert resp.json()["success"] is True

    @pytest.mark.asyncio
    async def test_creator_deletes_action(self, client):
        leader = await create_test_user(name="Líder", email="lider@del.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=leader["id"], leader_id=leader["id"])
        action = await create_test_action(process_id=process["id"], leader_id=leader["id"], created_by=leader["id"])
        token = make_token(leader, active_role="process_leader")

        resp = await client.delete(f"/api/actions/{action['id']}", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_non_owner_forbidden_on_delete(self, client):
        admin = await create_test_user(name="Admin", email="admin@del2.com", roles="admin")
        other = await create_test_user(name="Otro", email="otro@del.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])
        token = make_token(other, active_role="process_leader")

        resp = await client.delete(f"/api/actions/{action['id']}", headers=auth_headers(token))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_action_not_found_on_delete(self, client):
        admin = await create_test_user(name="Admin", email="admin@del3.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.delete("/api/actions/9999", headers=auth_headers(token))
        assert resp.status_code == 404


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/actions/{action_id}/files
# ──────────────────────────────────────────────────────────────────────────────

class TestActionFiles:

    @pytest.mark.asyncio
    async def test_get_action_files(self, client):
        admin = await create_test_user(name="Admin", email="admin@files.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])
        token = make_token(admin, active_role="admin")

        resp = await client.get(f"/api/actions/{action['id']}/files", headers=auth_headers(token))
        assert resp.status_code == 200
        assert resp.json()["success"] is True

    @pytest.mark.asyncio
    async def test_get_files_action_not_found(self, client):
        admin = await create_test_user(name="Admin", email="admin@files2.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.get("/api/actions/9999/files", headers=auth_headers(token))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_get_files_forbidden(self, client):
        admin = await create_test_user(name="Admin", email="admin@files3.com", roles="admin")
        other = await create_test_user(name="Otro", email="otro@files.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])
        token = make_token(other, active_role="process_leader")

        resp = await client.get(f"/api/actions/{action['id']}/files", headers=auth_headers(token))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_delete_file_not_found(self, client):
        admin = await create_test_user(name="Admin", email="admin@files4.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])
        token = make_token(admin, active_role="admin")

        resp = await client.delete(f"/api/actions/{action['id']}/files/9999", headers=auth_headers(token))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_file_action_not_found(self, client):
        admin = await create_test_user(name="Admin", email="admin@files5.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.delete("/api/actions/9999/files/1", headers=auth_headers(token))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_file_forbidden(self, client):
        admin = await create_test_user(name="Admin", email="admin@files6.com", roles="admin")
        other = await create_test_user(name="Otro", email="otro@files2.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])
        token = make_token(other, active_role="process_leader")

        resp = await client.delete(f"/api/actions/{action['id']}/files/1", headers=auth_headers(token))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_download_file_action_not_found(self, client):
        admin = await create_test_user(name="Admin", email="admin@files7.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.get("/api/actions/9999/files/1/download", headers=auth_headers(token))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_download_file_forbidden(self, client):
        admin = await create_test_user(name="Admin", email="admin@files8.com", roles="admin")
        other = await create_test_user(name="Otro", email="otro@files3.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])
        token = make_token(other, active_role="process_leader")

        resp = await client.get(f"/api/actions/{action['id']}/files/1/download", headers=auth_headers(token))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_download_file_resource_not_found(self, client):
        admin = await create_test_user(name="Admin", email="admin@files9.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])
        token = make_token(admin, active_role="admin")

        resp = await client.get(f"/api/actions/{action['id']}/files/9999/download", headers=auth_headers(token))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_preview_file_action_not_found(self, client):
        admin = await create_test_user(name="Admin", email="admin@files10.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.get("/api/actions/9999/files/1/preview", headers=auth_headers(token))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_preview_file_forbidden(self, client):
        admin = await create_test_user(name="Admin", email="admin@files11.com", roles="admin")
        other = await create_test_user(name="Otro", email="otro@files4.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])
        token = make_token(other, active_role="process_leader")

        resp = await client.get(f"/api/actions/{action['id']}/files/1/preview", headers=auth_headers(token))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_upload_file_action_not_found(self, client):
        admin = await create_test_user(name="Admin", email="admin@files12.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.post(
            "/api/actions/9999/files",
            files={"file": ("test.txt", b"content", "text/plain")},
            headers=auth_headers(token),
        )
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_upload_file_forbidden(self, client):
        admin = await create_test_user(name="Admin", email="admin@files13.com", roles="admin")
        other = await create_test_user(name="Otro", email="otro@files5.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])
        token = make_token(other, active_role="process_leader")

        resp = await client.post(
            f"/api/actions/{action['id']}/files",
            files={"file": ("test.txt", b"content", "text/plain")},
            headers=auth_headers(token),
        )
        assert resp.status_code == 403
import pytest
from tests.conftest import create_test_user, create_test_process, make_token, auth_headers


class TestCreateActionWithEvidence:
    @pytest.mark.asyncio
    async def test_create_action_with_evidence(self, client):
        admin = await create_test_user(name="Admin", email="admin@evd.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        token = make_token(admin, active_role="admin")
        
        data = {
            "process_id": process["id"],
            "leader_id": admin["id"],
            "name": "Accion con evidencia",
            "status": "pending"
        }
        
        files = {"evidence": ("test.pdf", b"dummy content", "application/pdf")}
        
        resp = await client.post("/api/actions/with-evidence", data=data, files=files, headers=auth_headers(token))
        assert resp.status_code == 200
        assert resp.json()["name"] == "Accion con evidencia"
        
    @pytest.mark.asyncio
    async def test_create_action_with_evidence_no_process(self, client):
        admin = await create_test_user(name="Admin", email="admin@evd2.com", roles="admin")
        token = make_token(admin, active_role="admin")
        
        data = {
            "process_id": 99999,
            "leader_id": admin["id"],
            "name": "Accion",
            "status": "pending"
        }
        
        resp = await client.post("/api/actions/with-evidence", data=data, headers=auth_headers(token))
        assert resp.status_code == 404
        
    @pytest.mark.asyncio
    async def test_create_action_with_evidence_forbidden(self, client):
        admin = await create_test_user(name="Admin", email="admin@evd3.com", roles="admin")
        other = await create_test_user(name="Otro", email="otro@evd.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        token = make_token(other, active_role="process_leader")
        
        data = {
            "process_id": process["id"],
            "leader_id": admin["id"],
            "name": "Accion",
            "status": "pending"
        }
        
        resp = await client.post("/api/actions/with-evidence", data=data, headers=auth_headers(token))
        assert resp.status_code == 403
