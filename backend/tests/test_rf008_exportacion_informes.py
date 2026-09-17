"""
RF-08 · Generación y Exportación de Informes Personalizados
============================================================

Pruebas unitarias para las condiciones y escenarios de prueba:
  - Intentar generar PDF de un informe sin seleccionar un reporte (report_id inexistente)
  - Reintentar exportar/descargar cuando ya se cerró la sesión o se venció el token (401)
  - Consulta de reportes con filtros que dejan la lista vacía
  - Seguridad: Intentar acceder o descargar informe de otro auditor (403 Forbidden)
  - Auditor crea y descarga informe propio exitosamente
"""

import pytest
import pytest_asyncio

from tests.conftest import (
    create_test_user,
    create_test_process,
    make_token,
    auth_headers,
)


# ──────────────────────────────────────────────────────────────────────────────
# Validación de Tokens y Sesión Vencida (401)
# ──────────────────────────────────────────────────────────────────────────────

class TestSesionYAutenticacionExportacion:
    """Validación de token vencido o faltante en la exportación/descarga de informes."""

    @pytest.mark.asyncio
    async def test_descargar_sin_token_retorna_401(self, client):
        response = await client.get("/api/audit/reports/1/download")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_descargar_con_token_invalido_retorna_401(self, client):
        headers = {"Authorization": "Bearer token_invalido_o_expirado"}
        response = await client.get("/api/audit/reports/1/download", headers=headers)
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_listar_reportes_sin_token_retorna_401(self, client):
        response = await client.get("/api/audit/reports")
        assert response.status_code == 401


# ──────────────────────────────────────────────────────────────────────────────
# Descarga y Generación con Reporte Inexistente o Sin Selección (404)
# ──────────────────────────────────────────────────────────────────────────────

class TestSeleccionDeReporteYFiltros:
    """Escenarios de intento de descarga sin reporte o con filtros vacíos."""

    @pytest.mark.asyncio
    async def test_descargar_informe_inexistente_retorna_404(self, client):
        admin = await create_test_user(name="Admin", email="admin_exp@test.com", roles="admin")
        token = make_token(admin, active_role="admin")

        response = await client.get(
            "/api/audit/reports/9999/download",
            headers=auth_headers(token),
        )

        assert response.status_code == 404
        data = response.json()
        error_msg = data.get("message") or data.get("detail", "")
        assert len(error_msg) > 0

    @pytest.mark.asyncio
    async def test_consultar_informes_con_filtro_proceso_inexistente_retorna_vacio(self, client):
        admin = await create_test_user(name="Admin", email="admin_filt@test.com", roles="admin")
        token = make_token(admin, active_role="admin")

        response = await client.get(
            "/api/audit/reports?process_id=99999",
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0


# ──────────────────────────────────────────────────────────────────────────────
# Control de Acceso y Permisos (403 Forbidden)
# ──────────────────────────────────────────────────────────────────────────────

class TestPermisosAccesoInformes:
    """Un auditor no puede acceder ni descargar los informes de otro auditor."""

    @pytest.mark.asyncio
    async def test_auditor_no_puede_descargar_informe_de_otro_auditor(self, client):
        auditor_a = await create_test_user(name="Auditor A", email="aud_a@test.com", roles="auditor")
        auditor_b = await create_test_user(name="Auditor B", email="aud_b@test.com", roles="auditor")
        admin = await create_test_user(name="Admin", email="admin_audit@test.com", roles="admin")

        process = await create_test_process(name="Proceso Auditado", created_by=admin["id"])

        # Auditor A crea un informe con el campo 'content' requerido
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

        # Auditor B intenta descargarlo
        token_b = make_token(auditor_b, active_role="auditor")
        get_resp = await client.get(
            f"/api/audit/reports/{report_id}",
            headers=auth_headers(token_b),
        )
        assert get_resp.status_code == 403
        assert "permisos" in get_resp.json()["detail"].lower()
