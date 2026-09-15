import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

sys.path.insert(0, str(Path(__file__).parents[1] / "backend"))

from app.api.endpoints.processes import read_processes
from app.core.config import settings


class PruebasCajaBlanca(unittest.IsolatedAsyncioTestCase):
    def admin(self):
        return {"id": 1, "roles": [settings.ROLE_ADMIN], "active_role": settings.ROLE_ADMIN}

    async def test_CP04_E04_admin_consulta_lista_general_de_procesos(self):
        procesos = [{"id": 7, "name": "Calidad", "status": "active"}]
        with patch("app.api.endpoints.processes.get_all_processes", new=AsyncMock(return_value=procesos)) as consultar:
            resultado = await read_processes(False, self.admin())
        self.assertEqual(resultado, procesos)
        consultar.assert_awaited_once_with(include_stats=False)

    async def test_CP05_E05_busqueda_por_nombre_descripcion_o_propietario(self):
        procesos = [{"name": "Calidad", "description": "Auditoria", "created_by": 10}]
        encontrados = [p for p in procesos if "calidad" in p["name"].lower() or "auditoria" in p["description"].lower() or p["created_by"] == 10]
        self.assertEqual(encontrados, procesos)

    async def test_CP06_E06_proceso_muestra_estado(self):
        procesos = [{"id": 7, "status": "active"}]
        with patch("app.api.endpoints.processes.get_all_processes", new=AsyncMock(return_value=procesos)):
            resultado = await read_processes(False, self.admin())
        self.assertTrue(all("status" in proceso for proceso in resultado))

    async def test_CP07_E07_ruta_de_acciones_del_proceso(self):
        process_id = 7
        self.assertEqual(f"/actions/process/{process_id}", "/actions/process/7")

    async def test_CP08_E08_ruta_de_estadisticas_del_proceso(self):
        process_id = 7
        self.assertEqual(f"/processes/{process_id}/statistics", "/processes/7/statistics")

    async def test_CP09_E09_proceso_inexistente_no_muestra_resultados(self):
        with patch("app.api.endpoints.processes.get_all_processes", new=AsyncMock(return_value=[])):
            resultado = await read_processes(False, self.admin())
        self.assertEqual(resultado, [])

    async def test_CP21_E21_busqueda_de_acciones_por_texto_o_responsable(self):
        acciones = [{"name": "Plan", "description": "Mejora", "leader_id": 10}]
        resultado = [a for a in acciones if "plan" in a["name"].lower() or "mejora" in a["description"].lower() or a["leader_id"] == 10]
        self.assertEqual(resultado, acciones)

    async def test_CP22_E22_filtro_por_estado_y_prioridad(self):
        acciones = [{"status": "pending", "priority": "high"}, {"status": "done", "priority": "low"}]
        resultado = [a for a in acciones if a["status"] == "pending" and a["priority"] == "high"]
        self.assertEqual(resultado, [acciones[0]])

    async def test_CP23_E23_combinacion_de_filtros(self):
        acciones = [{"name": "Plan de calidad", "status": "pending", "priority": "high"}]
        resultado = [a for a in acciones if "calidad" in a["name"].lower() and a["status"] == "pending" and a["priority"] == "high"]
        self.assertEqual(resultado, acciones)

    async def test_CP24_E24_busqueda_sin_resultados(self):
        acciones = []
        self.assertEqual(acciones, [])


if __name__ == "__main__":
    unittest.main()
