"""
RF-021 · Modificación Dinámica de Permisos
==========================================

Pruebas unitarias para las condiciones de prueba:
  - Revocar acceso a un módulo
  - Conceder acceso a un módulo nuevo
  - Usuario pierde acceso tras cambio
  - Usuario gana acceso tras cambio
  - Líder intenta modificar permisos
  - Auditor intenta modificar permisos
  - Permiso no existente
  - Usuario no encontrado
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
# Revocar acceso a un módulo (quitar un rol)
# ──────────────────────────────────────────────────────────────────────────────

class TestRevocarAccesoModulo:
    """Al revocar un rol, el usuario pierde acceso a los endpoints de ese rol."""

    @pytest.mark.asyncio
    async def test_revocar_rol_admin_a_lider(self, client):
        """Convertir un admin a process_leader le quita acceso al listado de usuarios."""
        admin = await create_test_user(
            name="Super Admin", email="superadmin@rev.com", roles="admin"
        )
        target = await create_test_user(
            name="Admin revocable", email="revocable@rev.com", roles="admin"
        )
        token_admin = make_token(admin, active_role="admin")

        # Revocar: cambiar de admin a process_leader
        response = await client.put(
            f"/api/users/{target['id']}",
            json={"roles": ["process_leader"]},
            headers=auth_headers(token_admin),
        )

        assert response.status_code == 200
        data = response.json()
        assert "admin" not in data["roles"]
        assert "process_leader" in data["roles"]


# ──────────────────────────────────────────────────────────────────────────────
# Conceder acceso a un módulo nuevo (agregar rol)
# ──────────────────────────────────────────────────────────────────────────────

class TestConcederAccesoModuloNuevo:
    """Al agregar un rol, el usuario gana acceso a módulos adicionales."""

    @pytest.mark.asyncio
    async def test_agregar_rol_auditor_a_lider(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@conc.com", roles="admin"
        )
        leader = await create_test_user(
            name="Líder", email="lider@conc.com", roles="process_leader"
        )
        token = make_token(admin, active_role="admin")

        response = await client.put(
            f"/api/users/{leader['id']}",
            json={"roles": ["process_leader", "auditor"]},
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        roles = response.json()["roles"]
        assert "process_leader" in roles
        assert "auditor" in roles


# ──────────────────────────────────────────────────────────────────────────────
# Usuario pierde acceso tras cambio
# ──────────────────────────────────────────────────────────────────────────────

class TestUsuarioPierdeAccesoTrasCambio:
    """Después de revocar un rol, el usuario ya no puede usar endpoints protegidos."""

    @pytest.mark.asyncio
    async def test_ex_admin_no_accede_listado_usuarios(self, client):
        admin = await create_test_user(
            name="Admin Perm", email="adminperm@lost.com", roles="admin"
        )
        target = await create_test_user(
            name="Target", email="target@lost.com", roles="admin"
        )
        token_admin = make_token(admin, active_role="admin")

        # Revocar admin → process_leader
        await client.put(
            f"/api/users/{target['id']}",
            json={"roles": ["process_leader"]},
            headers=auth_headers(token_admin),
        )

        # El usuario ahora con nuevo token (simulando re-login)
        updated_target = target.copy()
        updated_target["roles"] = ["process_leader"]
        token_target = make_token(updated_target, active_role="process_leader")

        # Intentar acceder al listado de usuarios (solo admin)
        response = await client.get(
            "/api/users/",
            headers=auth_headers(token_target),
        )

        assert response.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# Usuario gana acceso tras cambio
# ──────────────────────────────────────────────────────────────────────────────

class TestUsuarioGanaAccesoTrasCambio:
    """Después de conceder un rol, el usuario puede acceder a nuevos endpoints."""

    @pytest.mark.asyncio
    async def test_nuevo_admin_accede_listado_usuarios(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@gain.com", roles="admin"
        )
        leader = await create_test_user(
            name="Líder promovido", email="promoted@gain.com", roles="process_leader"
        )
        token_admin = make_token(admin, active_role="admin")

        # Promover a admin
        await client.put(
            f"/api/users/{leader['id']}",
            json={"roles": ["admin"]},
            headers=auth_headers(token_admin),
        )

        # Crear token nuevo con rol admin
        promoted = leader.copy()
        promoted["roles"] = ["admin"]
        token_promoted = make_token(promoted, active_role="admin")

        # Ahora puede acceder al listado de usuarios
        response = await client.get(
            "/api/users/",
            headers=auth_headers(token_promoted),
        )

        assert response.status_code == 200


# ──────────────────────────────────────────────────────────────────────────────
# Líder intenta modificar permisos
# ──────────────────────────────────────────────────────────────────────────────

class TestLiderIntentaModificarPermisos:
    """Un Líder de Proceso no puede modificar roles/permisos de otros usuarios."""

    @pytest.mark.asyncio
    async def test_lider_no_modifica_roles_de_otro(self, client):
        leader = await create_test_user(
            name="Líder", email="lider@modperm.com", roles="process_leader"
        )
        target = await create_test_user(
            name="Otro", email="otro@modperm.com", roles="process_leader"
        )
        token = make_token(leader, active_role="process_leader")

        response = await client.put(
            f"/api/users/{target['id']}",
            json={"roles": ["admin"]},
            headers=auth_headers(token),
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_lider_no_accede_endpoint_listado_usuarios(self, client):
        """El listado de usuarios completo está reservado a admin."""
        leader = await create_test_user(
            name="Líder", email="lider@nousers.com", roles="process_leader"
        )
        token = make_token(leader, active_role="process_leader")

        response = await client.get(
            "/api/users/",
            headers=auth_headers(token),
        )

        assert response.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# Auditor intenta modificar permisos
# ──────────────────────────────────────────────────────────────────────────────

class TestAuditorIntentaModificarPermisos:
    """Un Auditor no puede modificar roles/permisos."""

    @pytest.mark.asyncio
    async def test_auditor_no_modifica_roles(self, client):
        auditor = await create_test_user(
            name="Auditor", email="auditor@modperm.com", roles="auditor"
        )
        target = await create_test_user(
            name="Target", email="target@audmod.com", roles="process_leader"
        )
        token = make_token(auditor, active_role="auditor")

        response = await client.put(
            f"/api/users/{target['id']}",
            json={"roles": ["admin"]},
            headers=auth_headers(token),
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_auditor_no_crea_usuarios(self, client):
        """Un auditor tampoco puede crear usuarios nuevos."""
        auditor = await create_test_user(
            name="Auditor", email="auditor@nocreate.com", roles="auditor"
        )
        token = make_token(auditor, active_role="auditor")

        response = await client.post(
            "/api/users/",
            json={
                "name": "Nuevo User",
                "email": "nuevouser@test.com",
                "password": "Pass1234!",
                "roles": ["process_leader"],
            },
            headers=auth_headers(token),
        )

        assert response.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# Permiso no existente
# ──────────────────────────────────────────────────────────────────────────────

class TestPermisoNoExistente:
    """Intentar asignar un permiso/rol que no existe en el sistema."""

    @pytest.mark.asyncio
    async def test_asignar_rol_ficticio(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@noperm.com", roles="admin"
        )
        target = await create_test_user(
            name="Target", email="target@noperm.com", roles="process_leader"
        )
        token = make_token(admin, active_role="admin")

        response = await client.put(
            f"/api/users/{target['id']}",
            json={"roles": ["rol_que_no_existe"]},
            headers=auth_headers(token),
        )

        # El sistema no debe romper con error 500
        assert response.status_code in (200, 400, 422)

    @pytest.mark.asyncio
    async def test_asignar_rol_vacio_string(self, client):
        """Un rol como cadena vacía."""
        admin = await create_test_user(
            name="Admin", email="admin@emptyrole.com", roles="admin"
        )
        target = await create_test_user(
            name="Target", email="target@emptyrole.com", roles="process_leader"
        )
        token = make_token(admin, active_role="admin")

        response = await client.put(
            f"/api/users/{target['id']}",
            json={"roles": [""]},
            headers=auth_headers(token),
        )

        assert response.status_code in (200, 400, 422)


# ──────────────────────────────────────────────────────────────────────────────
# Usuario no encontrado
# ──────────────────────────────────────────────────────────────────────────────

class TestUsuarioNoEncontrado:
    """Intentar modificar permisos de un usuario que no existe."""

    @pytest.mark.asyncio
    async def test_modificar_permisos_usuario_inexistente(self, client):
        admin = await create_test_user(
            name="Admin", email="admin@nouser.com", roles="admin"
        )
        token = make_token(admin, active_role="admin")

        response = await client.put(
            "/api/users/99999",
            json={"roles": ["process_leader"]},
            headers=auth_headers(token),
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_modificar_permisos_id_negativo(self, client):
        """Un ID negativo tampoco debe encontrar usuario."""
        admin = await create_test_user(
            name="Admin", email="admin@negid.com", roles="admin"
        )
        token = make_token(admin, active_role="admin")

        response = await client.put(
            "/api/users/-1",
            json={"roles": ["auditor"]},
            headers=auth_headers(token),
        )

        # FastAPI puede devolver 404 o 422 dependiendo del path parameter validation
        assert response.status_code in (404, 422)
