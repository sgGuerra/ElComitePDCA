"""
RF-10 · Análisis Comparativo de la Evolución de Acciones de Mejora entre Periodos
=================================================================================

Pruebas unitarias para las condiciones y escenarios de prueba:
  - Periodo sin datos suficientes (retorna serie temporal con ceros sin error 500)
  - Cálculo de "Acciones por proceso" con división por cero (total=0 -> tasa=0)
  - Filtro por rango de fechas (week, month, quarter, year)
  - Validación de rango de fechas no reconocido (retorna 422 Unprocessable Entity)
  - Comparación de tasa de completitud entre diferentes periodos
"""

import pytest
import pytest_asyncio

from tests.conftest import (
    create_test_user,
    create_test_process,
    create_test_action,
    make_token,
    auth_headers,
)


# ──────────────────────────────────────────────────────────────────────────────
# Periodo Sin Datos y Prevención de División por Cero
# ──────────────────────────────────────────────────────────────────────────────

class TestPeriodoSinDatosYDivisionPorCero:
    """Valida que los endpoints no crasheen con divisiones por cero ni datos vacíos."""

    @pytest.mark.asyncio
    async def test_completion_rate_sin_acciones_retorna_cero(self, client):
        admin = await create_test_user(name="Admin Zero", email="zero@test.com", roles="admin")
        token = make_token(admin, active_role="admin")

        response = await client.get(
            "/api/statistics/completion-rate",
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["rate"] == 0

    @pytest.mark.asyncio
    async def test_actions_over_time_sin_acciones_retorna_serie_en_cero(self, client):
        admin = await create_test_user(name="Admin Time", email="time@test.com", roles="admin")
        token = make_token(admin, active_role="admin")

        response = await client.get(
            "/api/statistics/actions-over-time?date_range=week",
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for point in data:
            assert point["completed"] == 0
            assert point["pending"] == 0
            assert point["overdue"] == 0

    @pytest.mark.asyncio
    async def test_process_statistics_sin_acciones_no_divide_por_cero(self, client):
        admin = await create_test_user(name="Admin Proc", email="proc_zero@test.com", roles="admin")
        token = make_token(admin, active_role="admin")
        await create_test_process(name="Proceso Sin Acciones", created_by=admin["id"])

        response = await client.get(
            "/api/statistics/processes?include_zero_counts=true",
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        proc = next(p for p in data if p["process_name"] == "Proceso Sin Acciones")
        assert proc["total_actions"] == 0
        assert proc["completion_rate"] == 0.0


# ──────────────────────────────────────────────────────────────────────────────
# Rangos de Fecha Válidos e Inválidos
# ──────────────────────────────────────────────────────────────────────────────

class TestFiltrosRangoFecha:
    """Verifica el comportamiento de los filtros week, month, quarter, year."""

    @pytest.mark.asyncio
    @pytest.mark.parametrize("range_val", ["week", "month", "quarter", "year"])
    async def test_date_range_validos_retornan_200(self, client, range_val):
        admin = await create_test_user(name=f"Admin {range_val}", email=f"{range_val}@test.com", roles="admin")
        token = make_token(admin, active_role="admin")

        response = await client.get(
            f"/api/statistics/actions-over-time?date_range={range_val}",
            headers=auth_headers(token),
        )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_date_range_invalido_retorna_422(self, client):
        admin = await create_test_user(name="Admin Inv", email="inv_range@test.com", roles="admin")
        token = make_token(admin, active_role="admin")

        response = await client.get(
            "/api/statistics/actions-over-time?date_range=siglo_pasado",
            headers=auth_headers(token),
        )

        assert response.status_code == 422
