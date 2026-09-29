
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
