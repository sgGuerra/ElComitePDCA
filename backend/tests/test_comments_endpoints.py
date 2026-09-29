"""
Tests para los endpoints de comentarios (comments.py).
Cubre CRUD de comentarios de procesos y acciones, permisos.
"""

import pytest
import pytest_asyncio

from tests.conftest import (
    create_test_user,
    create_test_process,
    create_test_action,
    make_token,
    auth_headers,
    _test_execute,
    _test_insert,
)


# ──────────────────────────────────────────────────────────────────────────────
# Process Comments
# ──────────────────────────────────────────────────────────────────────────────

class TestProcessComments:

    @pytest.mark.asyncio
    async def test_admin_lists_process_comments(self, client):
        admin = await create_test_user(name="Admin", email="admin@comm.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        token = make_token(admin, active_role="admin")

        resp = await client.get(f"/api/comments/process/{process['id']}", headers=auth_headers(token))
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    @pytest.mark.asyncio
    async def test_creator_lists_process_comments(self, client):
        leader = await create_test_user(name="Líder", email="lider@comm.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=leader["id"], leader_id=leader["id"])
        token = make_token(leader, active_role="process_leader")

        resp = await client.get(f"/api/comments/process/{process['id']}", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_auditor_lists_pending_audit_comments(self, client):
        admin = await create_test_user(name="Admin", email="admin@comm2.com", roles="admin")
        auditor = await create_test_user(name="Auditor", email="auditor@comm.com", roles="auditor")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        await _test_execute("UPDATE processes SET status = 'pending_audit' WHERE id = ?", (process["id"],))
        token = make_token(auditor, active_role="auditor")

        resp = await client.get(f"/api/comments/process/{process['id']}", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_forbidden_for_non_authorized(self, client):
        admin = await create_test_user(name="Admin", email="admin@comm3.com", roles="admin")
        other = await create_test_user(name="Otro", email="otro@comm.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        token = make_token(other, active_role="process_leader")

        resp = await client.get(f"/api/comments/process/{process['id']}", headers=auth_headers(token))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_process_not_found(self, client):
        admin = await create_test_user(name="Admin", email="admin@comm4.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.get("/api/comments/process/9999", headers=auth_headers(token))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_admin_adds_process_comment(self, client):
        admin = await create_test_user(name="Admin", email="admin@comm5.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        token = make_token(admin, active_role="admin")

        resp = await client.post(
            f"/api/comments/process/{process['id']}?comment=Buen+trabajo",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_add_comment_process_not_found(self, client):
        admin = await create_test_user(name="Admin", email="admin@comm6.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.post(
            "/api/comments/process/9999?comment=Hola",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_add_comment_forbidden(self, client):
        admin = await create_test_user(name="Admin", email="admin@comm7.com", roles="admin")
        other = await create_test_user(name="Otro", email="otro@comm2.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        token = make_token(other, active_role="process_leader")

        resp = await client.post(
            f"/api/comments/process/{process['id']}?comment=No+debería",
            headers=auth_headers(token),
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_delete_own_process_comment(self, client):
        admin = await create_test_user(name="Admin", email="admin@comm8.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        # Insert a comment directly
        comment_id = await _test_insert(
            "INSERT INTO process_comments (process_id, user_id, comment) VALUES (?, ?, ?)",
            (process["id"], admin["id"], "Comentario a eliminar")
        )
        token = make_token(admin, active_role="admin")

        resp = await client.delete(f"/api/comments/process/comment/{comment_id}", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_process_comment_forbidden(self, client):
        admin = await create_test_user(name="Admin", email="admin@comm9.com", roles="admin")
        other = await create_test_user(name="Otro", email="otro@comm3.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        comment_id = await _test_insert(
            "INSERT INTO process_comments (process_id, user_id, comment) VALUES (?, ?, ?)",
            (process["id"], admin["id"], "Comentario")
        )
        token = make_token(other, active_role="process_leader")

        resp = await client.delete(f"/api/comments/process/comment/{comment_id}", headers=auth_headers(token))
        assert resp.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# Action Comments
# ──────────────────────────────────────────────────────────────────────────────

class TestActionComments:

    @pytest.mark.asyncio
    async def test_admin_lists_action_comments(self, client):
        admin = await create_test_user(name="Admin", email="admin@acomm.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])
        token = make_token(admin, active_role="admin")

        resp = await client.get(f"/api/comments/action/{action['id']}", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_leader_lists_action_comments(self, client):
        admin = await create_test_user(name="Admin", email="admin@acomm2.com", roles="admin")
        leader = await create_test_user(name="Líder", email="lider@acomm.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=leader["id"])
        action = await create_test_action(process_id=process["id"], leader_id=leader["id"], created_by=admin["id"])
        token = make_token(leader, active_role="process_leader")

        resp = await client.get(f"/api/comments/action/{action['id']}", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_action_not_found(self, client):
        admin = await create_test_user(name="Admin", email="admin@acomm3.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.get("/api/comments/action/9999", headers=auth_headers(token))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_forbidden_for_unrelated_user(self, client):
        admin = await create_test_user(name="Admin", email="admin@acomm4.com", roles="admin")
        other = await create_test_user(name="Otro", email="otro@acomm.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])
        token = make_token(other, active_role="process_leader")

        resp = await client.get(f"/api/comments/action/{action['id']}", headers=auth_headers(token))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_admin_adds_action_comment(self, client):
        admin = await create_test_user(name="Admin", email="admin@acomm5.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])
        token = make_token(admin, active_role="admin")

        resp = await client.post(
            f"/api/comments/action/{action['id']}?comment=Buen+avance",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_add_action_comment_not_found(self, client):
        admin = await create_test_user(name="Admin", email="admin@acomm6.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.post(
            "/api/comments/action/9999?comment=Hola",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_add_action_comment_forbidden(self, client):
        admin = await create_test_user(name="Admin", email="admin@acomm7.com", roles="admin")
        other = await create_test_user(name="Otro", email="otro@acomm2.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])
        token = make_token(other, active_role="process_leader")

        resp = await client.post(
            f"/api/comments/action/{action['id']}?comment=No+debería",
            headers=auth_headers(token),
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_delete_own_action_comment(self, client):
        admin = await create_test_user(name="Admin", email="admin@acomm8.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])
        comment_id = await _test_insert(
            "INSERT INTO action_comments (action_id, user_id, comment) VALUES (?, ?, ?)",
            (action["id"], admin["id"], "Comentario a eliminar")
        )
        token = make_token(admin, active_role="admin")

        resp = await client.delete(f"/api/comments/action/comment/{comment_id}", headers=auth_headers(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_action_comment_forbidden(self, client):
        admin = await create_test_user(name="Admin", email="admin@acomm9.com", roles="admin")
        other = await create_test_user(name="Otro", email="otro@acomm3.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])
        comment_id = await _test_insert(
            "INSERT INTO action_comments (action_id, user_id, comment) VALUES (?, ?, ?)",
            (action["id"], admin["id"], "Comentario")
        )
        token = make_token(other, active_role="process_leader")

        resp = await client.delete(f"/api/comments/action/comment/{comment_id}", headers=auth_headers(token))
        assert resp.status_code == 403
