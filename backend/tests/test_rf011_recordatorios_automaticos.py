"""
RF-11 · Recordatorios Automáticos para Acciones de Mejora Próximas a Vencer
===========================================================================

Pruebas unitarias para las condiciones y escenarios de prueba:
  - Notificación que pertenezca a otro usuario (retorna 403 Forbidden - IDOR)
  - Marcar como leída notificación propia vs notificación ajena
  - Marcar todas las notificaciones como leídas (afecta únicamente al usuario actual)
  - Eliminación de notificaciones con control de pertenencia (403)
  - Consulta de acciones próximas a vencer en endpoints de estadísticas
"""

import pytest
import pytest_asyncio
from datetime import datetime, timedelta

from tests.conftest import (
    create_test_user,
    create_test_process,
    create_test_action,
    make_token,
    auth_headers,
)
from app.models.notification import create_notification


# ──────────────────────────────────────────────────────────────────────────────
# Protección IDOR y Aislamiento por Usuario (403 Forbidden)
# ──────────────────────────────────────────────────────────────────────────────

class TestAislamientoNotificacionesYSeguridad:
    """Valida que un usuario no pueda ver, modificar ni borrar notificaciones de otros."""

    @pytest.mark.asyncio
    async def test_usuario_no_puede_ver_notificacion_de_otro_usuario(self, client):
        user_a = await create_test_user(name="Usuario A", email="usera@test.com", roles="process_leader")
        user_b = await create_test_user(name="Usuario B", email="userb@test.com", roles="process_leader")

        # Crear notificación para usuario A
        notif = await create_notification(
            user_id=user_a["id"],
            title="Recordatorio: Acción por vencer",
            message="La acción vence en 48 horas.",
            related_type="action",
            related_id=1,
        )

        # Usuario B intenta leerla
        token_b = make_token(user_b, active_role="process_leader")
        response = await client.get(
            f"/api/notifications/{notif['id']}",
            headers=auth_headers(token_b),
        )

        assert response.status_code == 403
        assert "permisos" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_usuario_no_puede_marcar_como_leida_notificacion_ajena(self, client):
        user_a = await create_test_user(name="Usuario A2", email="usera2@test.com", roles="process_leader")
        user_b = await create_test_user(name="Usuario B2", email="userb2@test.com", roles="process_leader")

        notif = await create_notification(
            user_id=user_a["id"],
            title="Alerta de Vencimiento",
            message="Acción pendiente urgente.",
        )

        token_b = make_token(user_b, active_role="process_leader")
        response = await client.put(
            f"/api/notifications/{notif['id']}/read",
            headers=auth_headers(token_b),
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_usuario_no_puede_eliminar_notificacion_ajena(self, client):
        user_a = await create_test_user(name="Usuario A3", email="usera3@test.com", roles="process_leader")
        user_b = await create_test_user(name="Usuario B3", email="userb3@test.com", roles="process_leader")

        notif = await create_notification(
            user_id=user_a["id"],
            title="Alerta Crítica",
            message="Mensaje privado.",
        )

        token_b = make_token(user_b, active_role="process_leader")
        response = await client.delete(
            f"/api/notifications/{notif['id']}",
            headers=auth_headers(token_b),
        )

        assert response.status_code == 403


# ──────────────────────────────────────────────────────────────────────────────
# Marcar Todas Como Leídas y Próximos Vencimientos
# ──────────────────────────────────────────────────────────────────────────────

class TestOperacionesDeRecordatorios:
    """Valida marcar todas como leídas y filtro de acciones por vencer."""

    @pytest.mark.asyncio
    async def test_marcar_todas_solo_afecta_al_usuario_actual(self, client):
        user_a = await create_test_user(name="Líder A", email="lider_a@test.com", roles="process_leader")
        user_b = await create_test_user(name="Líder B", email="lider_b@test.com", roles="process_leader")

        # Crear notificación para A y otra para B
        await create_notification(user_id=user_a["id"], title="Notif A", message="Mensaje A")
        notif_b = await create_notification(user_id=user_b["id"], title="Notif B", message="Mensaje B")

        token_a = make_token(user_a, active_role="process_leader")
        resp_a = await client.put("/api/notifications/read-all", headers=auth_headers(token_a))
        assert resp_a.status_code == 200

        # Conteo de B debe seguir siendo 1 no leída
        token_b = make_token(user_b, active_role="process_leader")
        count_b = await client.get("/api/notifications/count", headers=auth_headers(token_b))
        assert count_b.status_code == 200
        assert count_b.json()["count"] == 1

    @pytest.mark.asyncio
    async def test_consulta_acciones_proximas_a_vencer(self, client):
        admin = await create_test_user(name="Admin Vence", email="vence@test.com", roles="admin")
        token = make_token(admin, active_role="admin")
        process = await create_test_process(name="Proceso Recordatorios", created_by=admin["id"])

        # Crear acción con vencimiento en 2 días
        fecha_proxima = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
        await create_test_action(
            process_id=process["id"],
            leader_id=admin["id"],
            created_by=admin["id"],
            name="Acción Próxima a Vencer",
            status="in_progress",
            target_date=fecha_proxima,
        )

        response = await client.get(
            "/api/statistics/upcoming-deadlines?date_range=month",
            headers=auth_headers(token),
        )

        assert response.status_code == 200
        deadlines = response.json()
        assert isinstance(deadlines, list)
