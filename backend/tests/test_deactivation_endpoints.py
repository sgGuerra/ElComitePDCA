"""
Tests para los endpoints de desactivación (deactivation.py).
Cubre creación de solicitudes y su procesamiento por admin.
"""

import pytest
import pytest_asyncio

from tests.conftest import (
    create_test_user,
    make_token,
    auth_headers,
    _test_insert,
    _test_execute
)


class TestDeactivationEndpoints:

    @pytest.mark.asyncio
    async def test_user_requests_deactivation(self, client):
        user = await create_test_user(name="User", email="user@deactep.com", roles="process_leader")
        token = make_token(user, active_role="process_leader")

        resp = await client.post("/api/deactivation/request-deactivation", json={
            "reason": "Me voy de la empresa"
        }, headers=auth_headers(token))
        assert resp.status_code == 200
        assert resp.json()["status"] == "pending"

    @pytest.mark.asyncio
    async def test_admin_lists_deactivation_requests(self, client):
        admin = await create_test_user(name="Admin", email="admin@deactep.com", roles="admin")
        user = await create_test_user(name="User2", email="user2@deactep.com", roles="process_leader")
        
        await _test_insert(
            "INSERT INTO user_deactivation_requests (user_id, reason, status) VALUES (?, ?, ?)",
            (user["id"], "Razón X", "pending")
        )
        token = make_token(admin, active_role="admin")

        resp = await client.get("/api/deactivation/deactivation-requests", headers=auth_headers(token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    @pytest.mark.asyncio
    async def test_non_admin_cannot_list_requests(self, client):
        user = await create_test_user(name="User3", email="user3@deactep.com", roles="process_leader")
        token = make_token(user, active_role="process_leader")

        resp = await client.get("/api/deactivation/deactivation-requests", headers=auth_headers(token))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_admin_approves_deactivation(self, client):
        admin = await create_test_user(name="Admin2", email="admin2@deactep.com", roles="admin")
        user = await create_test_user(name="User4", email="user4@deactep.com", roles="process_leader")
        req_id = await _test_insert(
            "INSERT INTO user_deactivation_requests (user_id, reason, status) VALUES (?, ?, ?)",
            (user["id"], "Razón Y", "pending")
        )
        token = make_token(admin, active_role="admin")

        resp = await client.post(f"/api/deactivation/deactivation-requests/{req_id}/process", json={
            "approve": True
        }, headers=auth_headers(token))
        assert resp.status_code == 200
        assert resp.json()["status"] == "approved"

    @pytest.mark.asyncio
    async def test_admin_rejects_deactivation(self, client):
        admin = await create_test_user(name="Admin3", email="admin3@deactep.com", roles="admin")
        user = await create_test_user(name="User5", email="user5@deactep.com", roles="process_leader")
        req_id = await _test_insert(
            "INSERT INTO user_deactivation_requests (user_id, reason, status) VALUES (?, ?, ?)",
            (user["id"], "Razón Z", "pending")
        )
        token = make_token(admin, active_role="admin")

        resp = await client.post(f"/api/deactivation/deactivation-requests/{req_id}/process", json={
            "approve": False
        }, headers=auth_headers(token))
        assert resp.status_code == 200
        assert resp.json()["status"] == "rejected"

    @pytest.mark.asyncio
    async def test_process_deactivation_not_found(self, client):
        admin = await create_test_user(name="Admin4", email="admin4@deactep.com", roles="admin")
        token = make_token(admin, active_role="admin")

        resp = await client.post("/api/deactivation/deactivation-requests/99999/process", json={
            "approve": True
        }, headers=auth_headers(token))
        assert resp.status_code == 404
