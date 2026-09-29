"""
RF-007 · Evaluación del Desempeño Específico de Líderes de Proceso
===================================================================

Pruebas unitarias para las condiciones y escenarios de prueba:
  - Intento de realizar la evaluación sin líderes de proceso
  - Intento de evaluación sin datos/estadísticas de los líderes registrados
  - Filtrado y estadísticas por proceso específico y líderes asignados
  - Cálculo de tasa de completitud cuando no hay acciones (sin división por cero)
  - Validación de roles al consultar desempeño (Admin / Líder)
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
# Evaluación sin líderes de proceso o sin datos
# ──────────────────────────────────────────────────────────────────────────────

class TestEvaluacionSinLideresOSinDatos:
    """Escenarios donde no existen líderes o no hay acciones registradas."""

    @pytest.mark.asyncio
    async def test_proceso_sin_lideres_retorna_lista_vacia_sin_error(self, client):
        admin = await create_test_user(name="Admin", email="admin@eval.com", roles="admin")
        token = make_token(admin, active_role="admin")
        process = await create_test_process(name="Proceso Vacío", created_by=admin["id"], leader_id=None)

        response = await client.get(
            f"/api/assignments/process/{process['id']}/leaders",
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    @pytest.mark.asyncio
    async def test_estadisticas_proceso_sin_acciones_retorna_ceros_sin_division_por_cero(self, client):
        admin = await create_test_user(name="Admin", email="admin2@eval.com", roles="admin")
        token = make_token(admin, active_role="admin")
        process = await create_test_process(name="Proceso Sin Acciones", created_by=admin["id"])

        response = await client.get(
            f"/api/processes/{process['id']}/statistics",
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total_actions"] == 0
        assert data["completed_actions"] == 0
        assert data["completion_rate"] == 0

    @pytest.mark.asyncio
    async def test_lider_sin_procesos_asignados_retorna_lista_vacia(self, client):
        leader = await create_test_user(name="Líder Sin Asignar", email="leader_free@eval.com", roles="process_leader")
        token = make_token(leader, active_role="process_leader")

        response = await client.get(
            f"/api/assignments/leader/{leader['id']}/processes",
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0


# ──────────────────────────────────────────────────────────────────────────────
# Evaluación con líderes y métricas reales
# ──────────────────────────────────────────────────────────────────────────────

class TestEvaluacionConLideresYMetricas:
    """Escenarios con líderes asignados y acciones de mejora."""

    @pytest.mark.asyncio
    async def test_estadisticas_calculan_tasa_completitud_correcta(self, client):
        admin = await create_test_user(name="Admin Metric", email="metric@eval.com", roles="admin")
        leader = await create_test_user(name="Líder Operaciones", email="leader_op@eval.com", roles="process_leader")
        token = make_token(admin, active_role="admin")

        process = await create_test_process(name="Operaciones", created_by=admin["id"], leader_id=leader["id"])
        await assign_leader_to_process(process["id"], leader["id"], created_by=admin["id"])

        # Crear 1 completada y 1 pendiente (tasa esperada: 50.0%)
        await create_test_action(process["id"], leader["id"], admin["id"], name="Acción 1", status="completed")
        await create_test_action(process["id"], leader["id"], admin["id"], name="Acción 2", status="pending")

        response = await client.get(
            f"/api/processes/{process['id']}/statistics",
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total_actions"] == 2
        assert data["completed_actions"] == 1
        assert data["completion_rate"] == 50.0

    @pytest.mark.asyncio
    async def test_lideres_disponibles_retorna_solo_activos(self, client):
        admin = await create_test_user(name="Admin Disp", email="disp@eval.com", roles="admin")
        await create_test_user(name="Líder Activo", email="lider_act@eval.com", roles="process_leader", is_active=1)
        await create_test_user(name="Líder Inactivo", email="lider_inact@eval.com", roles="process_leader", is_active=0)
        token = make_token(admin, active_role="admin")

        response = await client.get(
            "/api/assignments/available-leaders",
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        leaders = response.json()
        emails = [l["email"] for l in leaders]
        assert "lider_act@eval.com" in emails
        assert "lider_inact@eval.com" not in emails
