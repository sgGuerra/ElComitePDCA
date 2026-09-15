import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

sys.path.insert(0, str(Path(__file__).parents[1] / "backend"))

from fastapi import HTTPException
from app.api.endpoints.audit import create_new_audit_report, list_audit_reports, list_processes_for_auditor_review
from app.core.auth import verify_auditor
from app.core.config import settings


class PruebasCajaGris(unittest.IsolatedAsyncioTestCase):
    async def test_CP17_E17_auditor_consulta_procesos_pending_audit(self):
        procesos = [{"id": 7, "status": "pending_audit"}]
        usuario = {"id": 20, "roles": [settings.ROLE_AUDITOR], "active_role": settings.ROLE_AUDITOR}
        with patch("app.api.endpoints.audit.get_all_processes", new=AsyncMock(return_value=procesos)) as consultar:
            resultado = await list_processes_for_auditor_review(usuario)
        self.assertEqual(resultado, procesos)
        consultar.assert_awaited_once_with(status_filter="pending_audit")

    async def test_CP18_E18_auditor_consulta_informes_propios(self):
        informes = [{"id": 3, "auditor_id": 20, "title": "Revision"}]
        usuario = {"id": 20, "roles": [settings.ROLE_AUDITOR]}
        with patch("app.api.endpoints.audit.get_audit_reports", new=AsyncMock(return_value=informes)) as consultar:
            resultado = await list_audit_reports(None, usuario)
        self.assertEqual(resultado, informes)
        consultar.assert_awaited_once_with(process_id=None, auditor_id=20)

    async def test_CP19_E19_usuario_sin_rol_auditor_recibe_403(self):
        usuario = {"id": 30, "roles": [settings.ROLE_PROCESS_LEADER], "active_role": settings.ROLE_PROCESS_LEADER}
        with self.assertRaises(HTTPException) as contexto:
            await verify_auditor(usuario)
        self.assertEqual(contexto.exception.status_code, 403)

    async def test_CP20_E20_informe_se_asocia_al_auditor_autenticado(self):
        entrada = SimpleNamespace(model_dump=lambda: {"process_id": 7, "title": "Revision", "description": "Hallazgos"})
        informe = {"id": 3, "auditor_id": 20}
        usuario = {"id": 20, "roles": [settings.ROLE_AUDITOR]}
        with patch("app.api.endpoints.audit.create_audit_report", new=AsyncMock(return_value=informe)) as crear:
            resultado = await create_new_audit_report(entrada, usuario)
        self.assertEqual(resultado, informe)
        crear.assert_awaited_once_with(process_id=7, title="Revision", description="Hallazgos", auditor_id=20)

    async def test_CP25_E25_usuario_sin_permisos_no_consulta_accion(self):
        accion = {"id": 20, "created_by": 10, "leader_id": 11}
        with patch("app.api.endpoints.actions.get_action_by_id", new=AsyncMock(return_value=accion)):
            with self.assertRaises(HTTPException) as contexto:
                from app.api.endpoints.actions import read_action
                await read_action(20, {"id": 99, "active_role": settings.ROLE_PROCESS_LEADER})
        self.assertEqual(contexto.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
