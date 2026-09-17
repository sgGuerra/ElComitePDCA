"""
RF-08 · Generación y Exportación de Informes Personalizados
============================================================

Pruebas unitarias (backend). Las pruebas de exportación de CSV (E06, E08)
viven en frontend/src/pages/ActionsList.test.jsx, junto al código que
corrigen. Aquí solo queda la prueba de seguridad más representativa:
  - Seguridad: un auditor no puede ver/descargar el informe de otro auditor
"""

import pytest
import pytest_asyncio

from tests.conftest import (
    create_test_user,
    create_test_process,
    make_token,
    auth_headers,
)


class TestPermisosAccesoInformes:
    """Un auditor no puede acceder ni descargar los informes de otro auditor."""

    @pytest.mark.asyncio
    async def test_auditor_no_puede_descargar_informe_de_otro_auditor(self, client):
        # Arrange: el Auditor A crea un informe propio (queda listo antes de "actuar")
        auditor_a = await create_test_user(name="Auditor A", email="aud_a@test.com", roles="auditor")
        auditor_b = await create_test_user(name="Auditor B", email="aud_b@test.com", roles="auditor")
        admin = await create_test_user(name="Admin", email="admin_audit@test.com", roles="admin")

        process = await create_test_process(name="Proceso Auditado", created_by=admin["id"])

        token_a = make_token(auditor_a, active_role="auditor")
        create_resp = await client.post(
            "/api/audit/reports",
            json={
                "process_id": process["id"],
                "title": "Informe Confidencial A",
                "content": "Contenido del informe de auditoría A",
                "status": "draft",
            },
            headers=auth_headers(token_a),
        )
        assert create_resp.status_code == 200
        report_id = create_resp.json()["id"]

        # Act: el Auditor B (dueño de nada) intenta ver ese informe ajeno
        token_b = make_token(auditor_b, active_role="auditor")
        get_resp = await client.get(
            f"/api/audit/reports/{report_id}",
            headers=auth_headers(token_b),
        )

        # Assert: debe rebotar con 403, no dejarlo pasar
        assert get_resp.status_code == 403
        assert "permisos" in get_resp.json()["detail"].lower()
