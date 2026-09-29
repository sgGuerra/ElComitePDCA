import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_audit_flow(async_client: AsyncClient, admin_user, auditor_user, test_process):
    proc_id = test_process["id"]

    # 1. Request process audit as admin
    req_audit = await async_client.post(
        f"/api/audit/processes/{proc_id}/request-audit",
        headers=admin_user["headers"]
    )
    assert req_audit.status_code == 200
    assert req_audit.json()["status"] == "pending_audit"

    # 2. List processes for review as auditor
    review_list = await async_client.get(
        "/api/audit/processes-for-review",
        headers=auditor_user["headers"]
    )
    assert review_list.status_code == 200
    assert any(p["id"] == proc_id for p in review_list.json())

    # 3. Create audit report as auditor
    report_payload = {
        "title": "Informe de Auditoría Interna",
        "content": "Resultados de la auditoría: conforme",
        "process_id": proc_id,
        "status": "draft"
    }
    create_rep = await async_client.post(
        "/api/audit/reports",
        headers=auditor_user["headers"],
        json=report_payload
    )
    assert create_rep.status_code == 200
    rep_data = create_rep.json()
    rep_id = rep_data["id"]

    # 4. List reports
    list_rep = await async_client.get("/api/audit/reports", headers=auditor_user["headers"])
    assert list_rep.status_code == 200
    assert any(r["id"] == rep_id for r in list_rep.json())

    # 5. Read report by ID
    get_rep = await async_client.get(f"/api/audit/reports/{rep_id}", headers=auditor_user["headers"])
    assert get_rep.status_code == 200

    # 6. Update report
    update_rep = await async_client.put(
        f"/api/audit/reports/{rep_id}",
        headers=auditor_user["headers"],
        json={"title": "Informe Final Conforme", "status": "completed"}
    )
    assert update_rep.status_code == 200
    assert update_rep.json()["status"] == "completed"

    # 7. Delete report (returns 200 or 204)
    del_rep = await async_client.delete(f"/api/audit/reports/{rep_id}", headers=auditor_user["headers"])
    assert del_rep.status_code in (200, 204)
