import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

sys.path.insert(0, str(Path(__file__).parents[1] / "backend"))

from fastapi import HTTPException
from jose import jwt as jose_jwt
from app.api.endpoints.actions import read_action
from app.api.endpoints.audit import (
    create_new_audit_report,
    delete_existing_audit_report,
    download_audit_report_pdf,
    get_single_audit_report,
    list_audit_reports,
    list_processes_for_auditor_review,
    request_process_audit,
    update_existing_audit_report,
)
from app.api.endpoints.notifications import (
    delete_notification_by_id,
    mark_all_as_read,
    mark_as_read,
    read_notification,
    read_notifications,
    read_unread_notification_count,
)
from app.api.endpoints.processes import (
    delete_process_by_id,
    get_process_assigned_leaders,
    get_process_detailed_statistics,  
    read_process,
    read_processes,
    update_process_info,
)
from app.core.auth import get_current_user, verify_role
from app.core.config import settings
from app.models import action as action_model
from app.models import audit as audit_model
from app.models import notification as notification_model
from app.models import process as process_model


class PruebasUnitarias(unittest.IsolatedAsyncioTestCase):
    async def test_CP01_E01_lista_notificaciones_usuario_autenticado(self):
        datos = [{"id": 1, "user_id": 10, "title": "Aviso"}]
        with patch("app.api.endpoints.notifications.get_notifications_by_user", new=AsyncMock(return_value=datos)) as consultar:
            resultado = await read_notifications(False, 50, 0, {"id": 10})
        self.assertEqual(resultado, datos)
        consultar.assert_awaited_once_with(user_id=10, unread_only=False, limit=50, offset=0)

    async def test_CP02_E02_ruta_inexistente_devuelve_no_encontrado(self):
        with patch("app.api.endpoints.notifications.get_notification_by_id", new=AsyncMock(return_value=None)):
            with self.assertRaises(HTTPException) as contexto:
                await read_notification(999, {"id": 10})
        self.assertEqual(contexto.exception.status_code, 404)

    async def test_CP03_E03_usuario_sin_notificaciones_devuelve_lista_vacia(self):
        with patch("app.api.endpoints.notifications.get_notifications_by_user", new=AsyncMock(return_value=[])):
            resultado = await read_notifications(False, 50, 0, {"id": 99})
        self.assertEqual(resultado, [])

    async def test_CP10_E10_consulta_datos_detallados_de_accion(self):
        accion = {"id": 20, "created_by": 10, "leader_id": 10, "name": "Mejora"}
        with patch("app.api.endpoints.actions.get_action_by_id", new=AsyncMock(return_value=accion)):
            resultado = await read_action(20, {"id": 10, "active_role": "process_leader"})
        self.assertEqual(resultado, accion)

    async def test_CP11_E11_historial_de_cambios_no_expuesto_por_backend_actual(self):
        self.skipTest("El backend actual no define GET /api/actions/{id}/history")

    async def test_CP12_E12_usuario_no_autorizado_recibe_403(self):
        accion = {"id": 20, "created_by": 10, "leader_id": 11}
        with patch("app.api.endpoints.actions.get_action_by_id", new=AsyncMock(return_value=accion)):
            with self.assertRaises(HTTPException) as contexto:
                await read_action(20, {"id": 99, "active_role": "process_leader"})
        self.assertEqual(contexto.exception.status_code, 403)

    async def test_notificacion_create_get_mark_delete_count(self):
        inserted = {"id": 7, "user_id": 10, "title": "Aviso", "message": "hola", "read": 0}
        updated = {"id": 7, "user_id": 10, "title": "Aviso", "message": "hola", "read": 1}

        with patch("app.models.notification.insert", new=AsyncMock(return_value=7)) as insertar, \
             patch("app.models.notification.get_one", new=AsyncMock(return_value=inserted)) as obtener:
            resultado = await notification_model.create_notification(10, "Aviso", "hola")
        self.assertEqual(resultado, inserted)
        insertar.assert_awaited_once()
        obtener.assert_awaited()

        with patch("app.models.notification.get_notification_by_id", new=AsyncMock(side_effect=[updated, updated])), \
             patch("app.models.notification.execute", new=AsyncMock(return_value=None)):
            resultado = await notification_model.mark_notification_as_read(7)
        self.assertEqual(resultado["read"], 1)

        with patch("app.models.notification.get_one", new=AsyncMock(return_value={"count": 2})):
            count = await notification_model.get_unread_notification_count(10)
        self.assertEqual(count, 2)

        with patch("app.models.notification.execute", new=AsyncMock(return_value=None)), \
             patch("app.models.notification.get_one", new=AsyncMock(return_value={"count": 3})):
            all_read = await notification_model.mark_all_notifications_as_read(10)
        self.assertEqual(all_read, 3)

        with patch("app.models.notification.get_one", new=AsyncMock(return_value=None)):
            self.assertFalse(await notification_model.delete_notification(99))

        with patch("app.models.notification.get_all", new=AsyncMock(return_value=[inserted])) as consultar:
            resultado = await notification_model.get_notifications_by_user(10, unread_only=True, limit=10, offset=5)
        self.assertEqual(resultado, [inserted])
        consultar.assert_awaited_once()

    async def test_process_model_flow(self):
        process_row = {"id": 3, "name": "Calidad", "description": "Revisión", "status": "active", "created_by": 11}

        with patch("app.models.process.insert", new=AsyncMock(return_value=3)), \
             patch("app.models.process.get_one", new=AsyncMock(return_value=process_row)):
            created = await process_model.create_process(SimpleNamespace(name="Calidad", description="Revisión", status="active"), 11)
        self.assertEqual(created["name"], "Calidad")

        with patch("app.models.process.get_one", new=AsyncMock(return_value=process_row)):
            fetched = await process_model.get_process_by_id(3)
        self.assertEqual(fetched["id"], 3)

        with patch("app.models.process.get_all", new=AsyncMock(return_value=[process_row])) as consultar, \
             patch("app.models.process.get_process_statistics", new=AsyncMock(return_value={"total_actions": 2, "completed_actions": 1, "pending_actions": 1, "overdue_actions": 0})):
            result = await process_model.get_all_processes(include_stats=True)
        self.assertEqual(result[0]["total_actions"], 2)
        consultar.assert_awaited_once()

        updated_process = {**process_row, "status": "closed"}
        with patch("app.models.process.get_process_by_id", new=AsyncMock(side_effect=[process_row, updated_process])), \
             patch("app.models.process.execute", new=AsyncMock(return_value=None)):
            updated = await process_model.update_process(3, SimpleNamespace(name=None, description=None, status="closed"))
        self.assertEqual(updated["status"], "closed")

        with patch("app.models.process.get_process_by_id", new=AsyncMock(return_value=process_row)), \
             patch("app.models.process.execute", new=AsyncMock(return_value=None)):
            self.assertTrue(await process_model.delete_process(3))

        with patch("app.models.process.get_one", new=AsyncMock(side_effect=[{"count": 4}, {"count": 2}, {"count": 1}, {"count": 0}])):
            stats = await process_model.get_process_statistics(3)
        self.assertEqual(stats["total_actions"], 4)
        self.assertEqual(stats["completed_actions"], 2)
        self.assertEqual(stats["pending_actions"], 1)
        self.assertEqual(stats["overdue_actions"], 0)

    async def test_action_model_flow(self):
        action_row = {"id": 12, "process_id": 3, "leader_id": 4, "created_by": 1, "name": "Mejora", "status": "pending"}

        with patch("app.models.action.insert", new=AsyncMock(return_value=12)), \
             patch("app.models.action.create_notification", new=AsyncMock(return_value=None)), \
             patch("app.models.action.get_action_by_id", new=AsyncMock(return_value=action_row)):
            result = await action_model.create_action(SimpleNamespace(process_id=3, leader_id=4, name="Mejora", origin=None, start_date=None, target_date=None, what=None, why=None, how=None, where=None, status="pending", evidence=None, completion_percentage=0, related_type=None, related_id=None), 1)
        self.assertEqual(result["id"], 12)

        with patch("app.models.action.get_one", new=AsyncMock(return_value=action_row)):
            result = await action_model.get_action_by_id(12)
        self.assertEqual(result["name"], "Mejora")

        with patch("app.models.action.get_all", new=AsyncMock(return_value=[action_row])):
            result = await action_model.get_actions_by_process(3)
        self.assertEqual(len(result), 1)

        with patch("app.models.action.get_all", new=AsyncMock(return_value=[action_row])):
            result = await action_model.get_actions_by_leader(4)
        self.assertEqual(result[0]["leader_id"], 4)

        updated_action = {**action_row, "status": "completed"}
        with patch("app.models.action.get_action_by_id", new=AsyncMock(side_effect=[action_row, updated_action])), \
             patch("app.models.action.execute", new=AsyncMock(return_value=None)), \
             patch("app.models.action._handle_status_change_notification", new=AsyncMock(return_value=None)):
            updated = await action_model.update_action(12, SimpleNamespace(model_dump=lambda *, exclude_unset=True: {"status": "completed"}))
        self.assertEqual(updated["status"], "completed")

        with patch("app.models.action.get_action_by_id", new=AsyncMock(return_value=action_row)), \
             patch("app.models.action.execute", new=AsyncMock(return_value=None)):
            self.assertTrue(await action_model.delete_action(12))

        with patch("app.models.action.get_one", new=AsyncMock(side_effect=[{"count": 10}, {"count": 4}, {"count": 3}, {"count": 2}, {"count": 1}])):
            stats = await action_model.get_action_statistics(3)
        self.assertEqual(stats["total"], 10)
        self.assertEqual(stats["completion_rate"], 40.0)

    async def test_audit_model_and_auth_flow(self):
        with patch("app.models.audit.insert", new=AsyncMock(return_value=9)), \
             patch("app.models.audit.get_one", new=AsyncMock(return_value={"id": 9, "title": "Auditoría", "auditor_id": 8, "process_id": 3})):
            created = await audit_model.create_audit_report("Auditoría", "Contenido", 8, process_id=3)
        self.assertEqual(created["id"], 9)

        with patch("app.models.audit.get_one", new=AsyncMock(return_value={"id": 9, "title": "Auditoría", "auditor_id": 8})):
            found = await audit_model.get_audit_report_by_id(9)
        self.assertEqual(found["title"], "Auditoría")

        with patch("app.models.audit.get_all", new=AsyncMock(return_value=[{"id": 9, "auditor_id": 8}])):
            reports = await audit_model.get_audit_reports(process_id=3, auditor_id=8)
        self.assertEqual(len(reports), 1)

        updated_report = {"id": 9, "auditor_id": 8, "title": "nuevo"}
        with patch("app.models.audit.get_audit_report_by_id", new=AsyncMock(return_value=updated_report)), \
             patch("app.models.audit.execute", new=AsyncMock(return_value=None)):
            updated = await audit_model.update_audit_report(9, title="nuevo")
        self.assertEqual(updated["title"], "nuevo")

        with patch("app.models.audit.execute", new=AsyncMock(return_value=None)):
            self.assertTrue(await audit_model.delete_audit_report(9))

        dependency = verify_role([settings.ROLE_ADMIN])
        current_user = {"id": 1, "roles": [settings.ROLE_ADMIN], "active_role": settings.ROLE_ADMIN}
        self.assertEqual(await dependency(current_user=current_user), current_user)

        with self.assertRaises(HTTPException) as contexto:
            await verify_role([settings.ROLE_AUDITOR])(current_user={"id": 2, "roles": [settings.ROLE_ADMIN], "active_role": settings.ROLE_ADMIN})
        self.assertEqual(contexto.exception.status_code, 403)

        with patch("app.core.auth.jwt.decode", return_value={"exp": 4102444800, "sub": "2", "roles": [settings.ROLE_ADMIN], "active_role": settings.ROLE_ADMIN}), \
             patch("app.core.auth.get_user_by_id", new=AsyncMock(return_value={"id": 2, "roles": [settings.ROLE_ADMIN], "is_active": True})):
            user = await get_current_user(token="abc")
        self.assertEqual(user["id"], 2)

    async def test_notification_endpoint_exhaustive_flow(self):
        datos = [{"id": 3, "user_id": 4, "title": "Aviso", "read": False}]

        with patch("app.api.endpoints.notifications.get_notifications_by_user", new=AsyncMock(return_value=datos)):
            resultado = await read_notifications(False, 10, 0, {"id": 4})
        self.assertEqual(resultado, datos)

        with patch("app.api.endpoints.notifications.get_unread_notification_count", new=AsyncMock(return_value=2)):
            resultado = await read_unread_notification_count({"id": 4})
        self.assertEqual(resultado, {"count": 2})

        with patch("app.api.endpoints.notifications.get_notification_by_id", new=AsyncMock(return_value={"id": 3, "user_id": 4, "title": "Aviso", "read": False})), \
             patch("app.api.endpoints.notifications.mark_notification_as_read", new=AsyncMock(return_value={"id": 3, "user_id": 4, "title": "Aviso", "read": True})):
            resultado = await mark_as_read(3, {"id": 4})
        self.assertTrue(resultado["read"])

        with patch("app.api.endpoints.notifications.get_notification_by_id", new=AsyncMock(return_value={"id": 3, "user_id": 5, "title": "Aviso"})):
            with self.assertRaises(HTTPException) as contexto:
                await mark_as_read(3, {"id": 4})
        self.assertEqual(contexto.exception.status_code, 403)

        with patch("app.api.endpoints.notifications.mark_all_notifications_as_read", new=AsyncMock(return_value=3)):
            resultado = await mark_all_as_read({"id": 4})
        self.assertEqual(resultado, {"count": 3})

        with patch("app.api.endpoints.notifications.get_notification_by_id", new=AsyncMock(return_value={"id": 3, "user_id": 4, "title": "Aviso"})), \
             patch("app.api.endpoints.notifications.delete_notification", new=AsyncMock(return_value=True)):
            resultado = await delete_notification_by_id(3, {"id": 4})
        self.assertTrue(resultado["success"])

        with patch("app.api.endpoints.notifications.get_notification_by_id", new=AsyncMock(return_value=None)):
            with self.assertRaises(HTTPException) as contexto:
                await read_notification(99, {"id": 4})
        self.assertEqual(contexto.exception.status_code, 404)

    async def test_process_endpoint_exhaustive_flow(self):
        admin = {"id": 1, "roles": [settings.ROLE_ADMIN], "active_role": settings.ROLE_ADMIN}
        leader = {"id": 7, "roles": [settings.ROLE_PROCESS_LEADER], "active_role": settings.ROLE_PROCESS_LEADER}

        with patch("app.api.endpoints.processes.get_all_processes", new=AsyncMock(return_value=[{"id": 1, "name": "Calidad"}])):
            resultado = await read_processes(False, admin)
        self.assertEqual(len(resultado), 1)

        with patch("app.api.endpoints.processes.get_leader_processes", new=AsyncMock(return_value=[{"id": 2, "name": "Leaders"}])):
            resultado = await read_processes(False, leader)
        self.assertEqual(resultado[0]["name"], "Leaders")

        with patch("app.api.endpoints.processes.create_process", new=AsyncMock(return_value={"id": 10, "name": "Nuevo"})):
            resultado = await __import__("app.api.endpoints.processes", fromlist=["create_new_process"]).create_new_process(
                SimpleNamespace(name="Nuevo", description="Desc", status="active"),
                admin,
            )
        self.assertEqual(resultado["name"], "Nuevo")

        with patch("app.api.endpoints.processes.get_process_by_id", new=AsyncMock(return_value={"id": 5, "name": "B", "created_by": 9, "status": "pending_audit"})), \
             patch("app.api.endpoints.processes.get_process_statistics", new=AsyncMock(return_value={"total_actions": 2, "completed_actions": 1, "pending_actions": 1, "overdue_actions": 0})):
            resultado = await read_process(5, {"id": 9, "roles": [settings.ROLE_PROCESS_LEADER], "active_role": settings.ROLE_PROCESS_LEADER})
        self.assertEqual(resultado["total_actions"], 2)

        with patch("app.api.endpoints.processes.get_process_by_id", new=AsyncMock(return_value=None)):
            with self.assertRaises(HTTPException) as contexto:
                await read_process(55, admin)
        self.assertEqual(contexto.exception.status_code, 404)

        with patch("app.api.endpoints.processes.get_process_by_id", new=AsyncMock(return_value={"id": 5, "name": "B", "created_by": 9, "status": "active"})), \
             patch("app.api.endpoints.processes.get_process_leaders", new=AsyncMock(return_value=[{"id": 12}])):
            with self.assertRaises(HTTPException) as contexto:
                await read_process(5, {"id": 13, "roles": [settings.ROLE_PROCESS_LEADER], "active_role": settings.ROLE_PROCESS_LEADER})
        self.assertEqual(contexto.exception.status_code, 403)

        with patch("app.api.endpoints.processes.get_process_by_id", new=AsyncMock(return_value={"id": 5, "name": "B", "created_by": 9, "status": "active"})), \
             patch("app.api.endpoints.processes.update_process", new=AsyncMock(return_value={"id": 5, "name": "B", "status": "closed"})):
            resultado = await update_process_info(5, SimpleNamespace(name=None, description=None, status="closed"), admin)
        self.assertEqual(resultado["status"], "closed")

        with patch("app.api.endpoints.processes.get_process_by_id", new=AsyncMock(return_value={"id": 5, "name": "B", "created_by": 9, "status": "active"})), \
             patch("app.api.endpoints.processes.delete_process", new=AsyncMock(return_value=True)):
            resultado = await delete_process_by_id(5, admin)
        self.assertTrue(resultado["success"])

        with patch("app.api.endpoints.processes.get_process_by_id", new=AsyncMock(return_value={"id": 5, "name": "B", "created_by": 9, "status": "active"})), \
             patch("app.api.endpoints.processes.get_process_leaders", new=AsyncMock(return_value=[{"id": 7}, {"id": 8}])):
            resultado = await get_process_assigned_leaders(5, admin)
        self.assertEqual(len(resultado), 2)

        with patch("app.api.endpoints.processes.get_process_by_id", new=AsyncMock(return_value={"id": 5, "name": "B", "created_by": 9, "status": "active"})), \
             patch("app.api.endpoints.processes.get_process_statistics", new=AsyncMock(return_value={"total_actions": 10, "completed_actions": 8, "pending_actions": 2, "overdue_actions": 0})), \
             patch("app.models.statistics.get_actions_by_status", new=AsyncMock(return_value={"pending": 2})), \
             patch("app.models.statistics.get_actions_by_type", new=AsyncMock(return_value={"improvement": 5})), \
             patch("app.models.statistics.get_actions_over_time", new=AsyncMock(return_value={"series": [1, 2]})), \
             patch("app.models.statistics.get_completion_rate", new=AsyncMock(return_value={"rate": 75})):
            resultado = await get_process_detailed_statistics(5, "month", admin)
        self.assertEqual(resultado["completion_rate"], 75)

    async def test_audit_endpoint_exhaustive_flow(self):
        admin = {"id": 1, "roles": [settings.ROLE_ADMIN], "active_role": settings.ROLE_ADMIN}
        auditor = {"id": 2, "roles": [settings.ROLE_AUDITOR], "active_role": settings.ROLE_AUDITOR}

        with patch("app.api.endpoints.audit.get_process_by_id", new=AsyncMock(return_value={"id": 8, "name": "Proceso", "created_by": 1})), \
             patch("app.api.endpoints.audit.update_process", new=AsyncMock(return_value={"id": 8, "status": "pending_audit"})), \
             patch("app.api.endpoints.audit.get_users_by_role", new=AsyncMock(return_value=[{"id": 2, "name": "Auditor"}])), \
             patch("app.api.endpoints.audit.create_notification", new=AsyncMock(return_value=None)):
            resultado = await request_process_audit(8, admin)
        self.assertEqual(resultado["status"], "pending_audit")

        with patch("app.api.endpoints.audit.get_all_processes", new=AsyncMock(return_value=[{"id": 8, "status": "pending_audit"}])):
            resultado = await list_processes_for_auditor_review(auditor)
        self.assertEqual(resultado[0]["id"], 8)

        with patch("app.api.endpoints.audit.create_audit_report", new=AsyncMock(return_value={"id": 9, "title": "Revisión"})):
            resultado = await create_new_audit_report(SimpleNamespace(model_dump=lambda: {"process_id": 8, "title": "Revisión", "description": "Hallazgos"}), auditor)
        self.assertEqual(resultado["id"], 9)

        with patch("app.api.endpoints.audit.get_audit_reports", new=AsyncMock(return_value=[{"id": 9, "auditor_id": 2}])):
            resultado = await list_audit_reports(None, auditor)
        self.assertEqual(resultado[0]["auditor_id"], 2)

        with patch("app.api.endpoints.audit.get_audit_report_by_id", new=AsyncMock(return_value={"id": 9, "auditor_id": 2, "title": "Revisión"})):
            resultado = await get_single_audit_report(9, auditor)
        self.assertEqual(resultado["id"], 9)

        with patch("app.api.endpoints.audit.get_audit_report_by_id", new=AsyncMock(return_value={"id": 9, "auditor_id": 2, "title": "Viejo"})), \
             patch("app.api.endpoints.audit.update_audit_report", new=AsyncMock(return_value={"id": 9, "auditor_id": 2, "title": "Nuevo"})):
            resultado = await update_existing_audit_report(9, SimpleNamespace(model_dump=lambda **kwargs: {"title": "Nuevo"}), auditor)
        self.assertEqual(resultado["title"], "Nuevo")

        with patch("app.api.endpoints.audit.get_audit_report_by_id", new=AsyncMock(return_value={"id": 9, "auditor_id": 2})), \
             patch("app.api.endpoints.audit.delete_audit_report", new=AsyncMock(return_value=True)):
            resultado = await delete_existing_audit_report(9, auditor)
        self.assertIsNone(resultado)

        with patch("app.api.endpoints.audit.get_audit_report_by_id", new=AsyncMock(return_value={"id": 9, "auditor_id": 2, "file_path": "/tmp/file.pdf"})):
            resultado = await download_audit_report_pdf(9, auditor)
        self.assertIn("message", resultado)

        with patch("app.api.endpoints.audit.get_audit_report_by_id", new=AsyncMock(return_value=None)):
            with self.assertRaises(HTTPException) as contexto:
                await get_single_audit_report(99, auditor)
        self.assertEqual(contexto.exception.status_code, 404)

    async def test_auth_edge_cases_and_role_checks(self):
        token = __import__("app.core.auth", fromlist=["create_access_token"]).create_access_token(
            17,
            {"roles": "admin,auditor", "active_role": settings.ROLE_ADMIN},
        )
        self.assertTrue(token)

        with patch("app.core.auth.jwt.decode", side_effect=jose_jwt.JWTError("boom")):
            with self.assertRaises(HTTPException) as ctx:
                await get_current_user(token="abc")
        self.assertEqual(ctx.exception.status_code, 403)

        expired_payload = {"exp": 1, "sub": "2", "roles": [settings.ROLE_ADMIN], "active_role": settings.ROLE_ADMIN}
        with patch("app.core.auth.jwt.decode", return_value=expired_payload), \
             patch("app.core.auth.get_user_by_id", new=AsyncMock(return_value={"id": 2, "roles": [settings.ROLE_ADMIN], "is_active": True})):
            with self.assertRaises(HTTPException) as ctx:
                await get_current_user(token="abc")
        self.assertEqual(ctx.exception.status_code, 401)

        with patch("app.core.auth.jwt.decode", return_value={"exp": 4102444800, "sub": "3", "roles": [settings.ROLE_AUDITOR], "active_role": settings.ROLE_AUDITOR}), \
             patch("app.core.auth.get_user_by_id", new=AsyncMock(return_value={"id": 3, "roles": [settings.ROLE_AUDITOR], "is_active": False})):
            with self.assertRaises(HTTPException) as ctx:
                await get_current_user(token="abc")
        self.assertEqual(ctx.exception.status_code, 403)

        with patch("app.core.auth.jwt.decode", return_value={"exp": 4102444800, "sub": "4", "roles": [settings.ROLE_PROCESS_LEADER], "active_role": settings.ROLE_PROCESS_LEADER}), \
             patch("app.core.auth.get_user_by_id", new=AsyncMock(return_value={"id": 4, "roles": [settings.ROLE_PROCESS_LEADER], "is_active": True})):
            user = await get_current_user(token="abc")
        self.assertEqual(user["active_role"], settings.ROLE_PROCESS_LEADER)

        with patch("app.core.auth.jwt.decode", return_value={"exp": 4102444800, "sub": "5", "roles": [settings.ROLE_ADMIN], "active_role": settings.ROLE_ADMIN}), \
             patch("app.core.auth.get_user_by_id", new=AsyncMock(return_value=None)):
            with self.assertRaises(HTTPException) as ctx:
                await get_current_user(token="abc")
        self.assertEqual(ctx.exception.status_code, 404)

        with patch("app.core.auth.jwt.decode", return_value={"exp": 4102444800, "sub": "6", "roles": [settings.ROLE_ADMIN]}), \
             patch("app.core.auth.get_user_by_id", new=AsyncMock(return_value={"id": 6, "roles": [settings.ROLE_ADMIN], "is_active": True})):
            user = await get_current_user(token="abc")
        self.assertEqual(user["active_role"], settings.ROLE_ADMIN)

        with self.assertRaises(HTTPException) as ctx:
            await verify_role([settings.ROLE_ADMIN])(current_user={"id": 2, "roles": [settings.ROLE_PROCESS_LEADER], "active_role": settings.ROLE_PROCESS_LEADER})
        self.assertEqual(ctx.exception.status_code, 403)

        with self.assertRaises(HTTPException) as ctx:
            await verify_role([settings.ROLE_ADMIN])(current_user={"id": 2, "roles": [settings.ROLE_ADMIN], "active_role": settings.ROLE_PROCESS_LEADER})
        self.assertEqual(ctx.exception.status_code, 403)

    async def test_notification_model_error_branches(self):
        with patch("app.models.notification.insert", new=AsyncMock(side_effect=RuntimeError("fail"))):
            with self.assertRaises(RuntimeError):
                await notification_model.create_notification(1, "t", "m")

        with patch("app.models.notification.get_one", new=AsyncMock(side_effect=RuntimeError("fail"))):
            self.assertIsNone(await notification_model.get_notification_by_id(1))

        with patch("app.models.notification.get_all", new=AsyncMock(side_effect=RuntimeError("fail"))):
            self.assertEqual(await notification_model.get_notifications_by_user(1), [])

        with patch("app.models.notification.get_notification_by_id", new=AsyncMock(return_value=None)):
            self.assertIsNone(await notification_model.mark_notification_as_read(1))

        with patch("app.models.notification.get_notification_by_id", new=AsyncMock(side_effect=RuntimeError("fail"))):
            self.assertIsNone(await notification_model.mark_notification_as_read(1))

        with patch("app.models.notification.execute", new=AsyncMock(side_effect=RuntimeError("fail"))):
            self.assertEqual(await notification_model.mark_all_notifications_as_read(1), 0)

        with patch("app.models.notification.get_notification_by_id", new=AsyncMock(return_value={"id": 1, "user_id": 1})), \
             patch("app.models.notification.execute", new=AsyncMock(side_effect=RuntimeError("fail"))):
            self.assertFalse(await notification_model.delete_notification(1))

        with patch("app.models.notification.get_one", new=AsyncMock(side_effect=RuntimeError("fail"))):
            self.assertEqual(await notification_model.get_unread_notification_count(1), 0)

    async def test_process_model_error_branches_and_noop_update(self):
        existing = {"id": 7, "name": "Proceso", "description": "desc", "status": "active", "created_by": 5}

        with patch("app.models.process.get_process_by_id", new=AsyncMock(return_value=existing)), \
             patch("app.models.process.execute", new=AsyncMock(return_value=None)):
            self.assertEqual(await process_model.update_process(7, SimpleNamespace(name=None, description=None, status=None)), existing)

        with patch("app.models.process.get_process_by_id", new=AsyncMock(return_value=None)):
            self.assertIsNone(await process_model.update_process(99, SimpleNamespace(name="N", description=None, status=None)))

        with patch("app.models.process.get_all", new=AsyncMock(side_effect=RuntimeError("fail"))):
            self.assertEqual(await process_model.get_all_processes(user_id=5, include_stats=True), [])

        with patch("app.models.process.get_one", new=AsyncMock(side_effect=RuntimeError("fail"))):
            self.assertEqual(
                await process_model.get_process_statistics(7),
                {"total_actions": 0, "completed_actions": 0, "pending_actions": 0, "overdue_actions": 0},
            )

        with patch("app.models.process.get_all", new=AsyncMock(side_effect=RuntimeError("fail"))):
            self.assertEqual(await process_model.get_processes_by_leader(5), [])

        with patch("app.models.process.get_process_by_id", new=AsyncMock(return_value=None)):
            self.assertFalse(await process_model.delete_process(5))

        with patch("app.models.process.get_process_by_id", new=AsyncMock(side_effect=RuntimeError("fail"))):
            self.assertFalse(await process_model.delete_process(5))

        with patch("app.models.process.insert", new=AsyncMock(side_effect=RuntimeError("fail"))):
            with self.assertRaises(RuntimeError):
                await process_model.create_process(SimpleNamespace(name="X", description="D", status="active"), 1)


if __name__ == "__main__":
    unittest.main()
