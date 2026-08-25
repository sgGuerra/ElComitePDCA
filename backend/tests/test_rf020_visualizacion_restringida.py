"""
RF-020 · Visualización Restringida por Líder de Proceso
=======================================================

Pruebas unitarias para las condiciones de prueba:
  - Ver listado propio
  - Verificar que no aparecen acciones de otros procesos
  - Acceso por URL manipulada
  - Respuesta del sistema (error 403 o redirección)
  - Intento de acceso sin sesión activa
  - Ver acciones de todos sus procesos
  - No ver acciones de procesos no asignados
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
# Ver listado propio
# ──────────────────────────────────────────────────────────────────────────────

class TestVerListadoPropio:
    """Un líder puede ver las acciones de los procesos que creó."""

    @pytest.mark.asyncio
    async def test_lider_ve_acciones_de_su_proceso(self, client):
        # Arrange
        leader = await create_test_user(
            name="Líder A", email="lidera@test.com", roles="process_leader"
        )
        process = await create_test_process(
            name="Proceso A", created_by=leader["id"], leader_id=leader["id"]
        )
        await create_test_action(
            process_id=process["id"],
            leader_id=leader["id"],
            created_by=leader["id"],
            name="Acción propia",
        )
        token = make_token(leader, active_role="process_leader")

        # Act
        response = await client.get(
            f"/api/actions/process/{process['id']}",
            headers=auth_headers(token),
        )

        # Assert
        assert response.status_code == 200
        actions = response.json()
        assert len(actions) >= 1
        assert any(a["name"] == "Acción propia" for a in actions)

    @pytest.mark.asyncio
    async def test_lider_ve_nombre_proceso_en_respuesta(self, client):
        """Cada acción devuelta incluye el nombre del proceso."""
        leader = await create_test_user(
            name="Líder", email="lider_detail@test.com", roles="process_leader"
        )
        process = await create_test_process(
            name="Mi Proceso", created_by=leader["id"], leader_id=leader["id"]
        )
        await create_test_action(
            process_id=process["id"],
            leader_id=leader["id"],
            created_by=leader["id"],
        )
        token = make_token(leader, active_role="process_leader")

        response = await client.get(
            f"/api/actions/process/{process['id']}",
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        actions = response.json()
        assert len(actions) >= 1
        assert actions[0]["process_name"] == "Mi Proceso"


# ──────────────────────────────────────────────────────────────────────────────
# Verificar que no aparecen acciones de otros procesos
# ──────────────────────────────────────────────────────────────────────────────

class TestNoApareceAccionesOtrosProcesos:
    """Al consultar un proceso, solo aparecen sus acciones, no las de otros."""

    @pytest.mark.asyncio
    async def test_acciones_solo_del_proceso_consultado(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@filter.com", roles="admin"
        )
        process_a = await create_test_process(
            name="Proceso A", created_by=admin["id"], leader_id=admin["id"]
        )
        process_b = await create_test_process(
            name="Proceso B", created_by=admin["id"], leader_id=admin["id"]
        )
        await create_test_action(
            process_id=process_a["id"], leader_id=admin["id"],
            created_by=admin["id"], name="Acción del A",
        )
        await create_test_action(
            process_id=process_b["id"], leader_id=admin["id"],
            created_by=admin["id"], name="Acción del B",
        )
        token = make_token(admin, active_role="admin")

        response = await client.get(
            f"/api/actions/process/{process_a['id']}",
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        actions = response.json()
        # Solo debe haber acciones del proceso A
        for action in actions:
            assert action["process_id"] == process_a["id"]
        assert not any(a["name"] == "Acción del B" for a in actions)


# ──────────────────────────────────────────────────────────────────────────────
# Acceso por URL manipulada
# ──────────────────────────────────────────────────────────────────────────────

class TestAccesoURLManipulada:
    """Un líder no puede acceder a procesos ajenos manipulando la URL."""

    @pytest.mark.asyncio
    async def test_lider_accede_proceso_ajeno_por_url(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@urlhack.com", roles="admin"
        )
        leader = await create_test_user(
            name="Líder B", email="liderb@urlhack.com", roles="process_leader"
        )
        # Proceso creado por el admin, no por el líder
        process = await create_test_process(
            name="Proceso Ajeno", created_by=admin["id"], leader_id=admin["id"]
        )
        await create_test_action(
            process_id=process["id"], leader_id=admin["id"],
            created_by=admin["id"], name="Acción secreta",
        )
        token = make_token(leader, active_role="process_leader")

        # El líder intenta acceder por URL directa
        response = await client.get(
            f"/api/actions/process/{process['id']}",
            headers=auth_headers(token),
        )

        # Debe ser rechazado con 403
        assert response.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# Respuesta del sistema (error 403 o redirección)
# ──────────────────────────────────────────────────────────────────────────────

class TestRespuestaSistema403:
    """El sistema responde con 403 Forbidden cuando el acceso es denegado."""

    @pytest.mark.asyncio
    async def test_respuesta_403_contiene_detalle(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@403.com", roles="admin"
        )
        leader = await create_test_user(
            name="Líder", email="lider@403.com", roles="process_leader"
        )
        process = await create_test_process(
            name="Proceso Restringido", created_by=admin["id"], leader_id=admin["id"]
        )
        token = make_token(leader, active_role="process_leader")

        response = await client.get(
            f"/api/actions/process/{process['id']}",
            headers=auth_headers(token),
        )

        assert response.status_code == 403
        body = response.json()
        assert "detail" in body

    @pytest.mark.asyncio
    async def test_respuesta_403_en_estadisticas_proceso_ajeno(self, client):
        """También en el endpoint de estadísticas de un proceso ajeno."""
        admin = await create_test_user(
            name="Admin", email="admin@403stats.com", roles="admin"
        )
        leader = await create_test_user(
            name="Líder", email="lider@403stats.com", roles="process_leader"
        )
        process = await create_test_process(
            name="Stats Restringido", created_by=admin["id"], leader_id=admin["id"]
        )
        token = make_token(leader, active_role="process_leader")

        response = await client.get(
            f"/api/actions/statistics?process_id={process['id']}",
            headers=auth_headers(token),
        )

        assert response.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# Intento de acceso sin sesión activa
# ──────────────────────────────────────────────────────────────────────────────

class TestAccesoSinSesion:
    """Peticiones sin token deben ser rechazadas con 401."""

    @pytest.mark.asyncio
    async def test_sin_token_acciones_proceso(self, client):
        response = await client.get("/api/actions/process/1")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_sin_token_estadisticas(self, client):
        response = await client.get("/api/actions/statistics")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_sin_token_crear_accion(self, client):
        response = await client.post(
            "/api/actions/",
            json={"name": "Hack", "process_id": 1, "leader_id": 1},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_token_invalido(self, client):
        """Un token corrupto también devuelve 401."""
        response = await client.get(
            "/api/actions/process/1",
            headers={"Authorization": "Bearer token-invalido-xyz"},
        )
        assert response.status_code == 401


# ──────────────────────────────────────────────────────────────────────────────
# Ver acciones de todos sus procesos
# ──────────────────────────────────────────────────────────────────────────────

class TestVerAccionesTodosSusProcesos:
    """Un líder con varios procesos puede ver acciones de cada uno de ellos."""

    @pytest.mark.asyncio
    async def test_lider_ve_acciones_de_multiples_procesos_propios(self, client):
        leader = await create_test_user(
            name="Líder Multi", email="multi@test.com", roles="process_leader"
        )
        proc1 = await create_test_process(
            name="Proceso 1", created_by=leader["id"], leader_id=leader["id"]
        )
        proc2 = await create_test_process(
            name="Proceso 2", created_by=leader["id"], leader_id=leader["id"]
        )
        await create_test_action(
            process_id=proc1["id"], leader_id=leader["id"],
            created_by=leader["id"], name="Acción P1",
        )
        await create_test_action(
            process_id=proc2["id"], leader_id=leader["id"],
            created_by=leader["id"], name="Acción P2",
        )
        token = make_token(leader, active_role="process_leader")

        # Consultar proceso 1
        r1 = await client.get(
            f"/api/actions/process/{proc1['id']}",
            headers=auth_headers(token),
        )
        assert r1.status_code == 200
        assert any(a["name"] == "Acción P1" for a in r1.json())

        # Consultar proceso 2
        r2 = await client.get(
            f"/api/actions/process/{proc2['id']}",
            headers=auth_headers(token),
        )
        assert r2.status_code == 200
        assert any(a["name"] == "Acción P2" for a in r2.json())


# ──────────────────────────────────────────────────────────────────────────────
# No ver acciones de procesos no asignados
# ──────────────────────────────────────────────────────────────────────────────

class TestNoVerAccionesNoAsignados:
    """Un líder NO puede ver acciones de procesos que no le pertenecen."""

    @pytest.mark.asyncio
    async def test_lider_no_ve_acciones_proceso_de_otro(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@noasig.com", roles="admin"
        )
        leader_a = await create_test_user(
            name="Líder A", email="la@noasig.com", roles="process_leader"
        )
        leader_b = await create_test_user(
            name="Líder B", email="lb@noasig.com", roles="process_leader"
        )
        # Proceso creado por líder A
        proc_a = await create_test_process(
            name="Proc de A", created_by=leader_a["id"], leader_id=leader_a["id"]
        )
        await create_test_action(
            process_id=proc_a["id"], leader_id=leader_a["id"],
            created_by=leader_a["id"], name="Solo para A",
        )

        # Líder B intenta ver las acciones
        token_b = make_token(leader_b, active_role="process_leader")
        response = await client.get(
            f"/api/actions/process/{proc_a['id']}",
            headers=auth_headers(token_b),
        )

        assert response.status_code == 403
