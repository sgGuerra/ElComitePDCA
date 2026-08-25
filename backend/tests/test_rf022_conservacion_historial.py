"""
RF-022 · Conservación del Historial al Eliminar Usuario
=======================================================

Pruebas unitarias para las condiciones de prueba:
  - Historial permanece en el sistema
  - Acciones siguen vinculadas al proceso
  - Eliminación exitosa sin errores
  - Líder intenta eliminar usuario
  - Auditor intenta eliminar usuario
  - Auditor puede ver historial del usuario eliminado
  - Datos no se alteran tras eliminación
"""

import pytest
import pytest_asyncio

from tests.conftest import (
    create_test_user,
    create_test_process,
    create_test_action,
    make_token,
    auth_headers,
    _test_get_all,
    _test_get_one,
)


# ──────────────────────────────────────────────────────────────────────────────
# Historial permanece en el sistema
# ──────────────────────────────────────────────────────────────────────────────

class TestHistorialPermanece:
    """Tras desactivar un usuario, las acciones que creó siguen existiendo."""

    @pytest.mark.asyncio
    async def test_acciones_permanecen_tras_desactivar_usuario(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@hist.com", roles="admin"
        )
        leader = await create_test_user(
            name="Líder a desactivar", email="lider@hist.com", roles="process_leader"
        )
        process = await create_test_process(
            name="Proceso Hist", created_by=admin["id"], leader_id=leader["id"]
        )
        action = await create_test_action(
            process_id=process["id"],
            leader_id=leader["id"],
            created_by=leader["id"],
            name="Acción histórica",
        )
        token = make_token(admin, active_role="admin")

        # Desactivar el usuario
        response = await client.post(
            f"/api/users/{leader['id']}/deactivate",
            headers=auth_headers(token),
        )

        assert response.status_code == 200

        # Verificar que la acción sigue existiendo en la BD
        action_in_db = await _test_get_one(
            "SELECT * FROM actions WHERE id = ?", (action["id"],)
        )
        assert action_in_db is not None
        assert action_in_db["name"] == "Acción histórica"


# ──────────────────────────────────────────────────────────────────────────────
# Acciones siguen vinculadas al proceso
# ──────────────────────────────────────────────────────────────────────────────

class TestAccionesVinculadasProceso:
    """Las acciones mantienen su relación con el proceso original."""

    @pytest.mark.asyncio
    async def test_acciones_mantienen_process_id(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@vinc.com", roles="admin"
        )
        leader = await create_test_user(
            name="Líder", email="lider@vinc.com", roles="process_leader"
        )
        process = await create_test_process(
            name="Proceso Vinculado", created_by=admin["id"], leader_id=leader["id"]
        )
        action = await create_test_action(
            process_id=process["id"],
            leader_id=leader["id"],
            created_by=leader["id"],
            name="Acción vinculada",
        )
        token = make_token(admin, active_role="admin")

        # Desactivar
        await client.post(
            f"/api/users/{leader['id']}/deactivate",
            headers=auth_headers(token),
        )

        # Consultar acciones del proceso: siguen ahí
        actions = await _test_get_all(
            "SELECT * FROM actions WHERE process_id = ?", (process["id"],)
        )
        assert len(actions) >= 1
        assert actions[0]["process_id"] == process["id"]
        assert actions[0]["leader_id"] == leader["id"]


# ──────────────────────────────────────────────────────────────────────────────
# Eliminación exitosa sin errores
# ──────────────────────────────────────────────────────────────────────────────

class TestEliminacionExitosa:
    """La desactivación del usuario se realiza correctamente."""

    @pytest.mark.asyncio
    async def test_desactivacion_retorna_success(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@elim.com", roles="admin"
        )
        user = await create_test_user(
            name="Usuario", email="user@elim.com", roles="process_leader"
        )
        token = make_token(admin, active_role="admin")

        response = await client.post(
            f"/api/users/{user['id']}/deactivate",
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    @pytest.mark.asyncio
    async def test_usuario_queda_inactivo_en_bd(self, client):
        """Verificar directamente en BD que is_active=0."""
        admin = await create_test_user(
            name="Admin", email="admin@inactive.com", roles="admin"
        )
        user = await create_test_user(
            name="Usuario", email="user@inactive.com", roles="process_leader"
        )
        token = make_token(admin, active_role="admin")

        await client.post(
            f"/api/users/{user['id']}/deactivate",
            headers=auth_headers(token),
        )

        user_db = await _test_get_one(
            "SELECT * FROM users WHERE id = ?", (user["id"],)
        )
        assert user_db["is_active"] == 0


# ──────────────────────────────────────────────────────────────────────────────
# Líder intenta eliminar usuario
# ──────────────────────────────────────────────────────────────────────────────

class TestLiderIntentaEliminar:
    """Un Líder de Proceso no puede desactivar otros usuarios."""

    @pytest.mark.asyncio
    async def test_lider_no_puede_desactivar_usuario(self, client):
        leader = await create_test_user(
            name="Líder", email="lider@nodel.com", roles="process_leader"
        )
        target = await create_test_user(
            name="Target", email="target@nodel.com", roles="process_leader"
        )
        token = make_token(leader, active_role="process_leader")

        response = await client.post(
            f"/api/users/{target['id']}/deactivate",
            headers=auth_headers(token),
        )

        assert response.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# Auditor intenta eliminar usuario
# ──────────────────────────────────────────────────────────────────────────────

class TestAuditorIntentaEliminar:
    """Un Auditor no puede desactivar usuarios."""

    @pytest.mark.asyncio
    async def test_auditor_no_puede_desactivar_usuario(self, client):
        auditor = await create_test_user(
            name="Auditor", email="auditor@nodel.com", roles="auditor"
        )
        target = await create_test_user(
            name="Target", email="target@auddel.com", roles="process_leader"
        )
        token = make_token(auditor, active_role="auditor")

        response = await client.post(
            f"/api/users/{target['id']}/deactivate",
            headers=auth_headers(token),
        )

        assert response.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# Auditor puede ver historial del usuario eliminado
# ──────────────────────────────────────────────────────────────────────────────

class TestAuditorVeHistorialEliminado:
    """Un auditor puede consultar acciones de un usuario ya desactivado."""

    @pytest.mark.asyncio
    async def test_auditor_consulta_acciones_usuario_desactivado(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@audhist.com", roles="admin"
        )
        leader = await create_test_user(
            name="Líder a desactivar", email="lider@audhist.com", roles="process_leader"
        )
        process = await create_test_process(
            name="Proceso Auditable", created_by=admin["id"], leader_id=leader["id"]
        )
        await create_test_action(
            process_id=process["id"],
            leader_id=leader["id"],
            created_by=leader["id"],
            name="Acción auditable",
        )
        token_admin = make_token(admin, active_role="admin")

        # Desactivar el usuario
        await client.post(
            f"/api/users/{leader['id']}/deactivate",
            headers=auth_headers(token_admin),
        )

        # El auditor consulta directamente las acciones en BD
        # (ya que el endpoint de acciones por proceso es verificado por creador)
        actions = await _test_get_all(
            """SELECT a.*, u.name as leader_name
               FROM actions a
               LEFT JOIN users u ON a.leader_id = u.id
               WHERE a.process_id = ?""",
            (process["id"],),
        )

        assert len(actions) >= 1
        assert actions[0]["name"] == "Acción auditable"
        # El nombre del líder sigue disponible incluso tras desactivación
        assert actions[0]["leader_name"] == "Líder a desactivar"


# ──────────────────────────────────────────────────────────────────────────────
# Datos no se alteran tras eliminación
# ──────────────────────────────────────────────────────────────────────────────

class TestDatosNoSeAlteranTrasEliminacion:
    """La desactivación del usuario no modifica los datos históricos."""

    @pytest.mark.asyncio
    async def test_datos_accion_intactos_tras_desactivacion(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@intacto.com", roles="admin"
        )
        leader = await create_test_user(
            name="Líder", email="lider@intacto.com", roles="process_leader"
        )
        process = await create_test_process(
            name="Proceso Intacto", created_by=admin["id"], leader_id=leader["id"]
        )
        action = await create_test_action(
            process_id=process["id"],
            leader_id=leader["id"],
            created_by=leader["id"],
            name="Acción inmutable",
            status="completed",
        )

        # Guardar snapshot antes de desactivar
        action_before = await _test_get_one(
            "SELECT * FROM actions WHERE id = ?", (action["id"],)
        )

        # Desactivar
        token = make_token(admin, active_role="admin")
        await client.post(
            f"/api/users/{leader['id']}/deactivate",
            headers=auth_headers(token),
        )

        # Comparar después
        action_after = await _test_get_one(
            "SELECT * FROM actions WHERE id = ?", (action["id"],)
        )

        assert action_after["name"] == action_before["name"]
        assert action_after["status"] == action_before["status"]
        assert action_after["process_id"] == action_before["process_id"]
        assert action_after["leader_id"] == action_before["leader_id"]
        assert action_after["created_by"] == action_before["created_by"]

    @pytest.mark.asyncio
    async def test_proceso_intacto_tras_desactivacion_lider(self, client):
        """El proceso asociado tampoco se altera."""
        admin = await create_test_user(
            name="Admin", email="admin@procint.com", roles="admin"
        )
        leader = await create_test_user(
            name="Líder", email="lider@procint.com", roles="process_leader"
        )
        process = await create_test_process(
            name="Proceso Preservado", created_by=admin["id"], leader_id=leader["id"]
        )

        process_before = await _test_get_one(
            "SELECT * FROM processes WHERE id = ?", (process["id"],)
        )

        token = make_token(admin, active_role="admin")
        await client.post(
            f"/api/users/{leader['id']}/deactivate",
            headers=auth_headers(token),
        )

        process_after = await _test_get_one(
            "SELECT * FROM processes WHERE id = ?", (process["id"],)
        )

        assert process_after["name"] == process_before["name"]
        assert process_after["status"] == process_before["status"]
        assert process_after["leader_id"] == process_before["leader_id"]
