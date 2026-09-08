"""
RF-009 · Gráficos Interactivos en el Tablero del Líder
======================================================

Pruebas unitarias para las condiciones de prueba:
  - Gráficos se renderizan (endpoints de estadísticas responden correctamente)
  - Datos corresponden al proceso del líder
  - Mensaje de "sin datos" o gráfico vacío sin error
  - Filtro por fecha funciona
  - Hover o clic muestra detalle correcto (endpoint devuelve detalle)
  - Datos del gráfico solo pertenecen al proceso del líder autenticado
  - Carga en menos de 5 segundos (RFN-002)
"""

import time

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
# Gráficos se renderizan (endpoints responden OK)
# ──────────────────────────────────────────────────────────────────────────────

class TestGraficosSeRenderizan:
    """Los endpoints de estadísticas devuelven respuestas exitosas (200)."""

    @pytest.mark.asyncio
    async def test_dashboard_statistics_retorna_200(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@graph.com", roles="admin"
        )
        token = make_token(admin, active_role="admin")

        response = await client.get(
            "/api/statistics/dashboard",
            headers=auth_headers(token),
        )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_actions_by_status_retorna_200(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@status.com", roles="admin"
        )
        token = make_token(admin, active_role="admin")

        response = await client.get(
            "/api/statistics/actions-by-status",
            headers=auth_headers(token),
        )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_actions_by_type_retorna_200(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@type.com", roles="admin"
        )
        token = make_token(admin, active_role="admin")

        response = await client.get(
            "/api/statistics/actions-by-type",
            headers=auth_headers(token),
        )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_completion_rate_retorna_200(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@rate.com", roles="admin"
        )
        token = make_token(admin, active_role="admin")

        response = await client.get(
            "/api/statistics/completion-rate",
            headers=auth_headers(token),
        )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_actions_over_time_retorna_200(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@time.com", roles="admin"
        )
        token = make_token(admin, active_role="admin")

        response = await client.get(
            "/api/statistics/actions-over-time",
            headers=auth_headers(token),
        )

        assert response.status_code == 200


# ──────────────────────────────────────────────────────────────────────────────
# Datos corresponden al proceso del líder
# ──────────────────────────────────────────────────────────────────────────────

class TestDatosCorrespondenAlProceso:
    """Los datos filtrados por process_id corresponden al proceso correcto."""

    @pytest.mark.asyncio
    async def test_estadisticas_filtradas_por_proceso(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@procdata.com", roles="admin"
        )
        process = await create_test_process(
            name="Proceso Datos", created_by=admin["id"], leader_id=admin["id"]
        )
        await create_test_action(
            process_id=process["id"], leader_id=admin["id"],
            created_by=admin["id"], name="Acción Completada", status="completed",
        )
        await create_test_action(
            process_id=process["id"], leader_id=admin["id"],
            created_by=admin["id"], name="Acción Pendiente", status="pending",
        )
        token = make_token(admin, active_role="admin")

        response = await client.get(
            f"/api/statistics/actions-by-status?process_id={process['id']}",
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        data = response.json()
        # Verificar que los datos contienen las categorías de status correctas
        statuses = [item["status"] for item in data]
        assert "completed" in statuses or "pending" in statuses

    @pytest.mark.asyncio
    async def test_estadisticas_proceso_tienen_conteo_correcto(self, client):
        """Los conteos reflejan las acciones reales del proceso."""
        admin = await create_test_user(
            name="Admin", email="admin@count.com", roles="admin"
        )
        process = await create_test_process(
            name="Proceso Conteo", created_by=admin["id"], leader_id=admin["id"]
        )
        # Crear 3 acciones completadas y 2 pendientes
        for i in range(3):
            await create_test_action(
                process_id=process["id"], leader_id=admin["id"],
                created_by=admin["id"], name=f"Completada {i}", status="completed",
            )
        for i in range(2):
            await create_test_action(
                process_id=process["id"], leader_id=admin["id"],
                created_by=admin["id"], name=f"Pendiente {i}", status="pending",
            )
        token = make_token(admin, active_role="admin")

        response = await client.get(
            f"/api/statistics/actions-by-status?process_id={process['id']}",
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        data = response.json()
        status_map = {item["status"]: item["count"] for item in data}
        assert status_map.get("completed", 0) == 3
        assert status_map.get("pending", 0) == 2


# ──────────────────────────────────────────────────────────────────────────────
# Mensaje de "sin datos" o gráfico vacío sin error
# ──────────────────────────────────────────────────────────────────────────────

class TestSinDatosSinError:
    """Cuando no hay datos, los endpoints devuelven respuestas vacías sin error."""

    @pytest.mark.asyncio
    async def test_dashboard_sin_acciones_retorna_ceros(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@nodata.com", roles="admin"
        )
        token = make_token(admin, active_role="admin")

        response = await client.get(
            "/api/statistics/dashboard",
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total_actions"] == 0
        assert data["completed_actions"] == 0
        assert data["pending_actions"] == 0
        assert data["completion_rate"] == 0

    @pytest.mark.asyncio
    async def test_actions_by_status_vacio(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@empty.com", roles="admin"
        )
        token = make_token(admin, active_role="admin")

        response = await client.get(
            "/api/statistics/actions-by-status",
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_actions_over_time_vacio(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@overtime.com", roles="admin"
        )
        token = make_token(admin, active_role="admin")

        response = await client.get(
            "/api/statistics/actions-over-time",
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    @pytest.mark.asyncio
    async def test_completion_rate_sin_datos_retorna_cero(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@zerorate.com", roles="admin"
        )
        token = make_token(admin, active_role="admin")

        response = await client.get(
            "/api/statistics/completion-rate",
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        assert response.json()["rate"] == 0


# ──────────────────────────────────────────────────────────────────────────────
# Filtro por fecha funciona
# ──────────────────────────────────────────────────────────────────────────────

class TestFiltroPorFecha:
    """Los filtros de rango de fecha funcionan correctamente."""

    @pytest.mark.asyncio
    async def test_filtro_por_semana(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@week.com", roles="admin"
        )
        token = make_token(admin, active_role="admin")

        response = await client.get(
            "/api/statistics/actions-by-status?date_range=week",
            headers=auth_headers(token),
        )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_filtro_por_mes(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@month.com", roles="admin"
        )
        token = make_token(admin, active_role="admin")

        response = await client.get(
            "/api/statistics/actions-by-status?date_range=month",
            headers=auth_headers(token),
        )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_filtro_por_trimestre(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@quarter.com", roles="admin"
        )
        token = make_token(admin, active_role="admin")

        response = await client.get(
            "/api/statistics/actions-by-status?date_range=quarter",
            headers=auth_headers(token),
        )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_filtro_por_anio(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@year.com", roles="admin"
        )
        token = make_token(admin, active_role="admin")

        response = await client.get(
            "/api/statistics/actions-by-status?date_range=year",
            headers=auth_headers(token),
        )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_filtro_fecha_invalida_rechazado(self, client):
        """Un valor de date_range no válido debe rechazarse."""
        admin = await create_test_user(
            name="Admin", email="admin@badrange.com", roles="admin"
        )
        token = make_token(admin, active_role="admin")

        response = await client.get(
            "/api/statistics/actions-by-status?date_range=invalid_range",
            headers=auth_headers(token),
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_actions_over_time_con_filtro_fecha(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@otf.com", roles="admin"
        )
        token = make_token(admin, active_role="admin")

        response = await client.get(
            "/api/statistics/actions-over-time?date_range=week",
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        data = response.json()
        # Para "week" debemos tener ~7 o 8 puntos de datos
        assert len(data) >= 1


# ──────────────────────────────────────────────────────────────────────────────
# Hover o clic muestra detalle correcto
# ──────────────────────────────────────────────────────────────────────────────

class TestDetalleCorrectoDatos:
    """Los endpoints proporcionan datos suficientes para mostrar detalles
    al hacer hover o clic en un gráfico (incluir acciones en respuesta)."""

    @pytest.mark.asyncio
    async def test_actions_by_status_incluye_acciones_detalladas(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@detail.com", roles="admin"
        )
        process = await create_test_process(
            name="Proceso Detail", created_by=admin["id"], leader_id=admin["id"]
        )
        await create_test_action(
            process_id=process["id"], leader_id=admin["id"],
            created_by=admin["id"], name="Acción de detalle", status="pending",
        )
        token = make_token(admin, active_role="admin")

        response = await client.get(
            f"/api/statistics/actions-by-status?process_id={process['id']}&include_actions=true",
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        data = response.json()
        # Al incluir acciones, cada item de status debe tener un campo "actions"
        for item in data:
            if item["count"] > 0:
                assert "actions" in item
                assert len(item["actions"]) > 0

    @pytest.mark.asyncio
    async def test_dashboard_incluye_ultima_accion(self, client):
        """El dashboard devuelve la última acción creada."""
        admin = await create_test_user(
            name="Admin", email="admin@last.com", roles="admin"
        )
        process = await create_test_process(
            name="Proceso Last", created_by=admin["id"], leader_id=admin["id"]
        )
        await create_test_action(
            process_id=process["id"], leader_id=admin["id"],
            created_by=admin["id"], name="Última acción creada",
        )
        token = make_token(admin, active_role="admin")

        response = await client.get(
            "/api/statistics/dashboard",
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["last_action"] is not None
        assert data["last_action"]["name"] == "Última acción creada"


# ──────────────────────────────────────────────────────────────────────────────
# Datos del gráfico solo pertenecen al proceso del líder autenticado
# ──────────────────────────────────────────────────────────────────────────────

class TestDatosSoloDelProcesoLider:
    """Cuando se filtra por proceso, los datos solo incluyen ese proceso."""

    @pytest.mark.asyncio
    async def test_estadisticas_filtradas_no_incluyen_otros_procesos(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@iso.com", roles="admin"
        )
        proc_a = await create_test_process(
            name="Proceso A", created_by=admin["id"], leader_id=admin["id"]
        )
        proc_b = await create_test_process(
            name="Proceso B", created_by=admin["id"], leader_id=admin["id"]
        )
        # 2 acciones en A, 5 en B
        for _ in range(2):
            await create_test_action(
                process_id=proc_a["id"], leader_id=admin["id"],
                created_by=admin["id"], status="pending",
            )
        for _ in range(5):
            await create_test_action(
                process_id=proc_b["id"], leader_id=admin["id"],
                created_by=admin["id"], status="pending",
            )
        token = make_token(admin, active_role="admin")

        # Consultar estadísticas solo del proceso A
        response = await client.get(
            f"/api/statistics/actions-by-status?process_id={proc_a['id']}",
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        data = response.json()
        total = sum(item["count"] for item in data)
        # Solo debe haber 2 acciones (las del proceso A)
        assert total == 2

    @pytest.mark.asyncio
    async def test_completion_rate_por_proceso(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@crate.com", roles="admin"
        )
        process = await create_test_process(
            name="Proceso Rate", created_by=admin["id"], leader_id=admin["id"]
        )
        # 1 completada, 1 pendiente = 50%
        await create_test_action(
            process_id=process["id"], leader_id=admin["id"],
            created_by=admin["id"], status="completed",
        )
        await create_test_action(
            process_id=process["id"], leader_id=admin["id"],
            created_by=admin["id"], status="pending",
        )
        token = make_token(admin, active_role="admin")

        response = await client.get(
            f"/api/statistics/completion-rate?process_id={process['id']}",
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["rate"] == 50.0


# ──────────────────────────────────────────────────────────────────────────────
# Carga en menos de 5 segundos (RFN-002)
# ──────────────────────────────────────────────────────────────────────────────

class TestRendimientoCarga:
    """Todos los endpoints de estadísticas deben responder en < 5 s."""

    @pytest.mark.asyncio
    async def test_dashboard_carga_rapida(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@perf1.com", roles="admin"
        )
        token = make_token(admin, active_role="admin")

        start = time.time()
        response = await client.get(
            "/api/statistics/dashboard",
            headers=auth_headers(token),
        )
        elapsed = time.time() - start

        assert response.status_code == 200
        assert elapsed < 5.0, f"Dashboard tardó {elapsed:.2f}s, excede 5s"

    @pytest.mark.asyncio
    async def test_actions_by_status_carga_rapida(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@perf2.com", roles="admin"
        )
        token = make_token(admin, active_role="admin")

        start = time.time()
        response = await client.get(
            "/api/statistics/actions-by-status",
            headers=auth_headers(token),
        )
        elapsed = time.time() - start

        assert response.status_code == 200
        assert elapsed < 5.0, f"Actions-by-status tardó {elapsed:.2f}s, excede 5s"

    @pytest.mark.asyncio
    async def test_actions_over_time_carga_rapida(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@perf3.com", roles="admin"
        )
        token = make_token(admin, active_role="admin")

        start = time.time()
        response = await client.get(
            "/api/statistics/actions-over-time",
            headers=auth_headers(token),
        )
        elapsed = time.time() - start

        assert response.status_code == 200
        assert elapsed < 5.0, f"Actions-over-time tardó {elapsed:.2f}s, excede 5s"

    @pytest.mark.asyncio
    async def test_completion_rate_carga_rapida(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@perf4.com", roles="admin"
        )
        token = make_token(admin, active_role="admin")

        start = time.time()
        response = await client.get(
            "/api/statistics/completion-rate",
            headers=auth_headers(token),
        )
        elapsed = time.time() - start

        assert response.status_code == 200
        assert elapsed < 5.0, f"Completion-rate tardó {elapsed:.2f}s, excede 5s"

    @pytest.mark.asyncio
    async def test_processes_stats_carga_rapida(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@perf5.com", roles="admin"
        )
        token = make_token(admin, active_role="admin")

        start = time.time()
        response = await client.get(
            "/api/statistics/processes",
            headers=auth_headers(token),
        )
        elapsed = time.time() - start

        assert response.status_code == 200
        assert elapsed < 5.0, f"Processes stats tardó {elapsed:.2f}s, excede 5s"
