"""
RF-12 · Notificaciones en Tiempo Real por Cambio de Estado de Acciones de Mejora
================================================================================

Pruebas unitarias para los 3 escenarios más representativos:
  - E21: cambios rápidos y repetidos de estado no generan notificaciones duplicadas
  - E23: cancelar una acción notifica al creador (antes no se notificaba nada)
  - E25: manipular notification_id en la URL de otro usuario (403 Forbidden - IDOR)
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
# E25: Protección contra Manipulación de URL (IDOR)
# ──────────────────────────────────────────────────────────────────────────────

class TestManipulacionNotificaciones:
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
