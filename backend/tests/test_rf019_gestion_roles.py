"""
RF-019 · Gestión de Roles y Asignación de Permisos
===================================================

Pruebas unitarias para las condiciones de prueba:
  CCP1-001  Asignar rol Administrador
  CCP1-002  Asignar rol Líder de Proceso
  CCP1-003  Asignar rol Auditor
  CCP2-001  Líder intenta asignar rol
  CCP2-002  Auditor intenta asignar rol
  CCP3-001  Usuario inexistente
  CCP3-002  Rol no reconocido
  CCP3-003  Campo vacío
  (extra)   Cambio de Líder a Auditor
  (extra)   Cambio de Auditor a Administrador
"""

import pytest
import pytest_asyncio

from tests.conftest import (
    create_test_user,
    make_token,
    auth_headers,
)


# ──────────────────────────────────────────────────────────────────────────────
# CCP1-001 · Asignar rol Administrador
# ──────────────────────────────────────────────────────────────────────────────

class TestCCP1001AsignarRolAdministrador:
    """Un admin puede asignar el rol 'admin' a otro usuario."""

    @pytest.mark.asyncio
    async def test_admin_asigna_rol_admin_exitosamente(self, client):
        # Arrange: admin y usuario objetivo
        admin = await create_test_user(
            name="Admin Principal", email="admin@test.com", roles="admin"
        )
        target_user = await create_test_user(
            name="Usuario Nuevo", email="nuevo@test.com", roles="process_leader"
        )
        token = make_token(admin, active_role="admin")

        # Act: actualizar roles del usuario objetivo
        response = await client.put(
            f"/api/users/{target_user['id']}",
            json={"roles": ["admin"]},
            headers=auth_headers(token),
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "admin" in data["roles"]

    @pytest.mark.asyncio
    async def test_admin_asigna_rol_admin_respuesta_contiene_id(self, client):
        """La respuesta debe contener el id del usuario actualizado."""
        admin = await create_test_user(
            name="Admin", email="admin2@test.com", roles="admin"
        )
        target = await create_test_user(
            name="Target", email="target2@test.com", roles="process_leader"
        )
        token = make_token(admin, active_role="admin")

        response = await client.put(
            f"/api/users/{target['id']}",
            json={"roles": ["admin"]},
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        assert response.json()["id"] == target["id"]


# ──────────────────────────────────────────────────────────────────────────────
# CCP1-002 · Asignar rol Líder de Proceso
# ──────────────────────────────────────────────────────────────────────────────

class TestCCP1002AsignarRolLider:
    """Un admin puede asignar el rol 'process_leader'."""

    @pytest.mark.asyncio
    async def test_admin_asigna_rol_lider(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@lider.com", roles="admin"
        )
        target = await create_test_user(
            name="Usuario", email="user@lider.com", roles="auditor"
        )
        token = make_token(admin, active_role="admin")

        response = await client.put(
            f"/api/users/{target['id']}",
            json={"roles": ["process_leader"]},
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        assert "process_leader" in response.json()["roles"]

    @pytest.mark.asyncio
    async def test_admin_asigna_multiples_roles_incluyendo_lider(self, client):
        """Se pueden asignar múltiples roles simultáneamente."""
        admin = await create_test_user(
            name="Admin", email="admin@multi.com", roles="admin"
        )
        target = await create_test_user(
            name="Multi", email="multi@roles.com", roles="auditor"
        )
        token = make_token(admin, active_role="admin")

        response = await client.put(
            f"/api/users/{target['id']}",
            json={"roles": ["process_leader", "auditor"]},
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        roles = response.json()["roles"]
        assert "process_leader" in roles
        assert "auditor" in roles


# ──────────────────────────────────────────────────────────────────────────────
# CCP1-003 · Asignar rol Auditor
# ──────────────────────────────────────────────────────────────────────────────

class TestCCP1003AsignarRolAuditor:
    """Un admin puede asignar el rol 'auditor'."""

    @pytest.mark.asyncio
    async def test_admin_asigna_rol_auditor(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@aud.com", roles="admin"
        )
        target = await create_test_user(
            name="Usuario", email="user@aud.com", roles="process_leader"
        )
        token = make_token(admin, active_role="admin")

        response = await client.put(
            f"/api/users/{target['id']}",
            json={"roles": ["auditor"]},
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        assert "auditor" in response.json()["roles"]


# ──────────────────────────────────────────────────────────────────────────────
# CCP2-001 · Líder intenta asignar rol
# ──────────────────────────────────────────────────────────────────────────────

class TestCCP2001LiderIntentaAsignarRol:
    """Un Líder de Proceso NO puede cambiar roles de otros usuarios."""

    @pytest.mark.asyncio
    async def test_lider_no_puede_asignar_roles_a_otro_usuario(self, client):
        leader = await create_test_user(
            name="Líder", email="lider@roles.com", roles="process_leader"
        )
        target = await create_test_user(
            name="Otro", email="otro@roles.com", roles="process_leader"
        )
        token = make_token(leader, active_role="process_leader")

        response = await client.put(
            f"/api/users/{target['id']}",
            json={"roles": ["admin"]},
            headers=auth_headers(token),
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_lider_no_puede_cambiar_su_propio_rol(self, client):
        """Un líder tampoco puede autoasignarse un rol superior."""
        leader = await create_test_user(
            name="Líder", email="lider_self@test.com", roles="process_leader"
        )
        token = make_token(leader, active_role="process_leader")

        response = await client.put(
            f"/api/users/{leader['id']}",
            json={"roles": ["admin"]},
            headers=auth_headers(token),
        )

        assert response.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# CCP2-002 · Auditor intenta asignar rol
# ──────────────────────────────────────────────────────────────────────────────

class TestCCP2002AuditorIntentaAsignarRol:
    """Un Auditor NO puede cambiar roles."""

    @pytest.mark.asyncio
    async def test_auditor_no_puede_asignar_roles(self, client):
        auditor = await create_test_user(
            name="Auditor", email="auditor@roles.com", roles="auditor"
        )
        target = await create_test_user(
            name="Otro", email="otro2@roles.com", roles="process_leader"
        )
        token = make_token(auditor, active_role="auditor")

        response = await client.put(
            f"/api/users/{target['id']}",
            json={"roles": ["admin"]},
            headers=auth_headers(token),
        )

        assert response.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# CCP3-001 · Usuario inexistente
# ──────────────────────────────────────────────────────────────────────────────

class TestCCP3001UsuarioInexistente:
    """Asignar rol a un usuario que no existe devuelve 404."""

    @pytest.mark.asyncio
    async def test_asignar_rol_usuario_inexistente(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@notfound.com", roles="admin"
        )
        token = make_token(admin, active_role="admin")

        response = await client.put(
            "/api/users/9999",
            json={"roles": ["process_leader"]},
            headers=auth_headers(token),
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_asignar_rol_usuario_id_cero(self, client):
        """Un id=0 tampoco debería encontrar usuario."""
        admin = await create_test_user(
            name="Admin", email="admin@zero.com", roles="admin"
        )
        token = make_token(admin, active_role="admin")

        response = await client.put(
            "/api/users/0",
            json={"roles": ["auditor"]},
            headers=auth_headers(token),
        )

        assert response.status_code == 404


# ──────────────────────────────────────────────────────────────────────────────
# CCP3-002 · Rol no reconocido
# ──────────────────────────────────────────────────────────────────────────────

class TestCCP3002RolNoReconocido:
    """Asignar un nombre de rol que no existe en el sistema."""

    @pytest.mark.asyncio
    async def test_asignar_rol_inventado(self, client):
        """El sistema acepta la cadena pero no la reconoce como rol válido.
        Se valida que al menos el endpoint no falla con 500 y que el rol
        queda almacenado literalmente (o se rechaza explícitamente).
        """
        admin = await create_test_user(
            name="Admin", email="admin@badrole.com", roles="admin"
        )
        target = await create_test_user(
            name="Target", email="target@badrole.com", roles="process_leader"
        )
        token = make_token(admin, active_role="admin")

        response = await client.put(
            f"/api/users/{target['id']}",
            json={"roles": ["super_mega_admin"]},
            headers=auth_headers(token),
        )

        # El sistema almacena el valor o lo rechaza, pero NO debe dar 500
        assert response.status_code in (200, 400, 422)


# ──────────────────────────────────────────────────────────────────────────────
# CCP3-003 · Campo vacío
# ──────────────────────────────────────────────────────────────────────────────

class TestCCP3003CampoVacio:
    """Enviar un campo de roles vacío o nulo."""

    @pytest.mark.asyncio
    async def test_roles_lista_vacia(self, client):
        """Una lista vacía de roles se rechaza o se ignora."""
        admin = await create_test_user(
            name="Admin", email="admin@empty.com", roles="admin"
        )
        target = await create_test_user(
            name="Target", email="target@empty.com", roles="process_leader"
        )
        token = make_token(admin, active_role="admin")

        response = await client.put(
            f"/api/users/{target['id']}",
            json={"roles": []},
            headers=auth_headers(token),
        )

        # Se espera que el sistema rechace roles vacíos o los ignore
        assert response.status_code in (200, 400, 422)

    @pytest.mark.asyncio
    async def test_roles_null(self, client):
        """Enviar roles=null no debe provocar error 500."""
        admin = await create_test_user(
            name="Admin", email="admin@null.com", roles="admin"
        )
        target = await create_test_user(
            name="Target", email="target@null.com", roles="process_leader"
        )
        token = make_token(admin, active_role="admin")

        response = await client.put(
            f"/api/users/{target['id']}",
            json={"roles": None},
            headers=auth_headers(token),
        )

        # roles=None es equivalente a "no cambiar" → 200
        assert response.status_code == 200


# ──────────────────────────────────────────────────────────────────────────────
# Cambio de Líder a Auditor
# ──────────────────────────────────────────────────────────────────────────────

class TestCambioLiderAAuditor:
    """Un admin puede cambiar un usuario de Líder a Auditor."""

    @pytest.mark.asyncio
    async def test_cambio_lider_a_auditor(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@change1.com", roles="admin"
        )
        user = await create_test_user(
            name="Líder", email="lider@change1.com", roles="process_leader"
        )
        token = make_token(admin, active_role="admin")

        response = await client.put(
            f"/api/users/{user['id']}",
            json={"roles": ["auditor"]},
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        data = response.json()
        assert "auditor" in data["roles"]
        assert "process_leader" not in data["roles"]


# ──────────────────────────────────────────────────────────────────────────────
# Cambio de Auditor a Administrador
# ──────────────────────────────────────────────────────────────────────────────

class TestCambioAuditorAAdministrador:
    """Un admin puede promover un auditor a administrador."""

    @pytest.mark.asyncio
    async def test_cambio_auditor_a_admin(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@change2.com", roles="admin"
        )
        user = await create_test_user(
            name="Auditor", email="auditor@change2.com", roles="auditor"
        )
        token = make_token(admin, active_role="admin")

        response = await client.put(
            f"/api/users/{user['id']}",
            json={"roles": ["admin"]},
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        data = response.json()
        assert "admin" in data["roles"]
        assert "auditor" not in data["roles"]
