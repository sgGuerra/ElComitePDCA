"""
RF-12 · Notificaciones en Tiempo Real por Cambio de Estado de Acciones de Mejora
================================================================================

Pruebas unitarias para las condiciones y escenarios de prueba:
  - Cambio de estado de acción (pending -> in_progress -> completed -> canceled)
  - Validación de permisos al cambiar estado (líder asignado o admin)
  - Intento de manipular notification_id en la URL de otro usuario (403 Forbidden - IDOR)
  - Usuario marca todas como leídas y valida actualización de conteo en tiempo real
  - Conteo de notificaciones no leídas responde con precisión
  - E21: cambios rápidos y repetidos de estado no generan notificaciones duplicadas
  - E23: cancelar una acción notifica al creador (antes no se notificaba nada)
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
from app.models.notification import create_notification, get_notifications_by_user


# ──────────────────────────────────────────────────────────────────────────────
# Cambios de Estado de Acciones de Mejora
# ──────────────────────────────────────────────────────────────────────────────

class TestCambioEstadoAcciones:
    """Valida transiciones de estado de acciones de mejora y sus permisos."""

    @pytest.mark.asyncio
    async def test_lider_puede_actualizar_estado_de_su_accion(self, client):
        admin = await create_test_user(name="Admin", email="admin_act@test.com", roles="admin")
        leader = await create_test_user(name="Líder", email="leader_act@test.com", roles="process_leader")

        process = await create_test_process(name="Proceso Acciones", created_by=admin["id"], leader_id=leader["id"])
        action = await create_test_action(
            process_id=process["id"],
            leader_id=leader["id"],
            created_by=admin["id"],
            name="Acción Inicial",
            status="pending",
        )

        token_leader = make_token(leader, active_role="process_leader")

        # Cambiar a in_progress
        resp_prog = await client.put(
            f"/api/actions/{action['id']}",
            json={"status": "in_progress"},
            headers=auth_headers(token_leader),
        )
        assert resp_prog.status_code == 200
        assert resp_prog.json()["status"] == "in_progress"

        # Cambiar a completed
        resp_comp = await client.put(
            f"/api/actions/{action['id']}",
            json={"status": "completed"},
            headers=auth_headers(token_leader),
        )
        assert resp_comp.status_code == 200
        assert resp_comp.json()["status"] == "completed"

    @pytest.mark.asyncio
    async def test_usuario_no_autorizado_no_puede_cambiar_estado(self, client):
        admin = await create_test_user(name="Admin", email="admin_noauth@test.com", roles="admin")
        leader_1 = await create_test_user(name="Líder 1", email="l1@test.com", roles="process_leader")
        leader_2 = await create_test_user(name="Líder 2", email="l2@test.com", roles="process_leader")

        process = await create_test_process(name="Proceso P", created_by=admin["id"])
        action = await create_test_action(
            process_id=process["id"],
            leader_id=leader_1["id"],
            created_by=admin["id"],
            name="Acción Líder 1",
            status="pending",
        )

        # Líder 2 intenta cambiar la acción de Líder 1
        token_l2 = make_token(leader_2, active_role="process_leader")
        response = await client.put(
            f"/api/actions/{action['id']}",
            json={"status": "completed"},
            headers=auth_headers(token_l2),
        )
        assert response.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# E21: Cambios Rápidos de Estado No Duplican Notificaciones
# ──────────────────────────────────────────────────────────────────────────────

class TestNoNotificacionesDuplicadas:
    """E21: cambiar el estado repetidamente a 'completed' no debe crear
    una notificación nueva cada vez si ya existe una sin leer para esa acción."""

    @pytest.mark.asyncio
    async def test_completar_dos_veces_seguidas_no_duplica_notificacion(self, client):
        # Valor por defecto del escenario roto: una acción que se marca
        # 'completed' más de una vez seguida (pending -> completed -> pending -> completed)
        admin = await create_test_user(name="Admin Dup", email="admin_dup@test.com", roles="admin")
        leader = await create_test_user(name="Líder Dup", email="leader_dup@test.com", roles="process_leader")

        process = await create_test_process(name="Proceso Dup", created_by=admin["id"], leader_id=leader["id"])
        action = await create_test_action(
            process_id=process["id"],
            leader_id=leader["id"],
            created_by=admin["id"],
            name="Acción Repetida",
            status="pending",
        )

        token_leader = make_token(leader, active_role="process_leader")

        # Primer completado
        resp1 = await client.put(
            f"/api/actions/{action['id']}",
            json={"status": "completed"},
            headers=auth_headers(token_leader),
        )
        assert resp1.status_code == 200

        # Se revierte y se vuelve a completar rápidamente (simula el doble clic / rebote de estado)
        resp2 = await client.put(
            f"/api/actions/{action['id']}",
            json={"status": "pending"},
            headers=auth_headers(token_leader),
        )
        assert resp2.status_code == 200

        resp3 = await client.put(
            f"/api/actions/{action['id']}",
            json={"status": "completed"},
            headers=auth_headers(token_leader),
        )
        assert resp3.status_code == 200

        # El creador (admin, distinto del líder) solo debe tener UNA notificación
        # de "Acción completada" sin leer para esta acción, no dos.
        notifications = await get_notifications_by_user(admin["id"])
        completed_notifs = [
            n for n in notifications
            if n["title"] == "Acción completada" and n["related_id"] == action["id"]
        ]
        assert len(completed_notifs) == 1


# ──────────────────────────────────────────────────────────────────────────────
# E23: Cancelar una Acción Notifica al Creador
# ──────────────────────────────────────────────────────────────────────────────

class TestNotificacionAlCancelar:
    """E23: cancelar una acción debe notificar al creador (antes no se
    generaba ninguna notificación, dejando a otros líderes sin enterarse)."""

    @pytest.mark.asyncio
    async def test_cancelar_accion_notifica_al_creador(self, client):
        # Valor por defecto del escenario roto: una acción activa que se cancela
        admin = await create_test_user(name="Admin Cancel", email="admin_cancel@test.com", roles="admin")
        leader = await create_test_user(name="Líder Cancel", email="leader_cancel@test.com", roles="process_leader")

        process = await create_test_process(name="Proceso Cancel", created_by=admin["id"], leader_id=leader["id"])
        action = await create_test_action(
            process_id=process["id"],
            leader_id=leader["id"],
            created_by=admin["id"],
            name="Acción a Cancelar",
            status="in_progress",
        )

        token_leader = make_token(leader, active_role="process_leader")
        response = await client.put(
            f"/api/actions/{action['id']}",
            json={"status": "canceled"},
            headers=auth_headers(token_leader),
        )
        assert response.status_code == 200
        assert response.json()["status"] == "canceled"

        notifications = await get_notifications_by_user(admin["id"])
        canceled_notifs = [
            n for n in notifications
            if n["title"] == "Acción cancelada" and n["related_id"] == action["id"]
        ]
        assert len(canceled_notifs) == 1


# ──────────────────────────────────────────────────────────────────────────────
# Notificaciones y Protección contra Manipulación de URL (IDOR)
# ──────────────────────────────────────────────────────────────────────────────

class TestManipulacionNotificacionesYConteo:
    """Valida que un usuario no pueda manipular el notification_id de otro usuario en la URL."""

    @pytest.mark.asyncio
    async def test_manipulacion_notification_id_en_url_bloqueada_con_403(self, client):
        user_x = await create_test_user(name="Usuario X", email="userx@test.com", roles="process_leader")
        user_y = await create_test_user(name="Usuario Y", email="usery@test.com", roles="process_leader")

        # Notificación para Usuario X
        notif_x = await create_notification(
            user_id=user_x["id"],
            title="Cambio de Estado",
            message="El estado de tu acción cambió a completed.",
            related_type="action",
            related_id=10,
        )

        # Usuario Y intenta ver la notificación manipulando el ID en la URL
        token_y = make_token(user_y, active_role="process_leader")
        get_resp = await client.get(
            f"/api/notifications/{notif_x['id']}",
            headers=auth_headers(token_y),
        )
        assert get_resp.status_code == 403
        assert "permisos" in get_resp.json()["detail"].lower()

        # Usuario Y intenta marcarla como leída manipulando el ID
        put_resp = await client.put(
            f"/api/notifications/{notif_x['id']}/read",
            headers=auth_headers(token_y),
        )
        assert put_resp.status_code == 403

    @pytest.mark.asyncio
    async def test_conteo_notificaciones_se_actualiza_al_marcar_leida(self, client):
        user = await create_test_user(name="Usuario Notif", email="notif_count@test.com", roles="process_leader")
        token = make_token(user, active_role="process_leader")

        notif1 = await create_notification(user_id=user["id"], title="N1", message="M1")
        notif2 = await create_notification(user_id=user["id"], title="N2", message="M2")

        # Conteo inicial debe ser 2
        count_resp1 = await client.get("/api/notifications/count", headers=auth_headers(token))
        assert count_resp1.status_code == 200
        assert count_resp1.json()["count"] == 2

        # Marcar 1 como leída
        read_resp = await client.put(f"/api/notifications/{notif1['id']}/read", headers=auth_headers(token))
        assert read_resp.status_code == 200

        # Conteo debe ser 1
        count_resp2 = await client.get("/api/notifications/count", headers=auth_headers(token))
        assert count_resp2.status_code == 200
        assert count_resp2.json()["count"] == 1
