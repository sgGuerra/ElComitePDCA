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
        # Arrange: una acción en pending, lista para que el líder le cambie el estado
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

        # Act: la marcamos completada, la devolvemos a pending y la volvemos a completar
        # rápido (simula el doble clic / rebote de estado que reportaba el escenario E21)
        resp1 = await client.put(
            f"/api/actions/{action['id']}",
            json={"status": "completed"},
            headers=auth_headers(token_leader),
        )
        assert resp1.status_code == 200

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

        # Assert: el creador (admin, distinto del líder) solo debe tener UNA
        # notificación de "Acción completada" sin leer para esta acción, no dos.
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
        # Arrange: una acción activa (in_progress), con líder y creador distintos
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

        # Act: el líder cancela la acción
        token_leader = make_token(leader, active_role="process_leader")
        response = await client.put(
            f"/api/actions/{action['id']}",
            json={"status": "canceled"},
            headers=auth_headers(token_leader),
        )

        # Assert: queda cancelada Y el creador recibe una notificación avisándole
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
        # Arrange: una notificación que le pertenece únicamente al Usuario X
        user_x = await create_test_user(name="Usuario X", email="userx@test.com", roles="process_leader")
        user_y = await create_test_user(name="Usuario Y", email="usery@test.com", roles="process_leader")

        notif_x = await create_notification(
            user_id=user_x["id"],
            title="Cambio de Estado",
            message="El estado de tu acción cambió a completed.",
            related_type="action",
            related_id=10,
        )
        token_y = make_token(user_y, active_role="process_leader")

        # Act: el Usuario Y intenta verla, adivinando/escribiendo el ID en la URL
        get_resp = await client.get(
            f"/api/notifications/{notif_x['id']}",
            headers=auth_headers(token_y),
        )

        # Assert: bloqueado con 403, no debería poder verla
        assert get_resp.status_code == 403
        assert "permisos" in get_resp.json()["detail"].lower()

        # Act: el Usuario Y intenta además marcarla como leída con el mismo ID ajeno
        put_resp = await client.put(
            f"/api/notifications/{notif_x['id']}/read",
            headers=auth_headers(token_y),
        )

        # Assert: también bloqueado con 403
        assert put_resp.status_code == 403
