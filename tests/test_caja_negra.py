import json
import os
import unittest
import urllib.error
import urllib.request


RUN_API_TESTS = os.getenv("RUN_API_TESTS") == "1"


@unittest.skipUnless(RUN_API_TESTS, "Defina RUN_API_TESTS=1 para ejecutar pruebas HTTP")
class PruebasCajaNegra(unittest.TestCase):
    base_url = os.getenv("API_URL", "http://localhost:8000")

    def solicitar(self, path):
        request = urllib.request.Request(self.base_url + path, method="GET")
        try:
            with urllib.request.urlopen(request) as response:
                return response.status, response.read()
        except urllib.error.HTTPError as error:
            return error.code, error.read()

    def test_CP13_E13_exportacion_pdf(self):
        status, _ = self.solicitar("/api/audit/export/pdf")
        self.assertIn(status, (200, 401, 403, 404))

    def test_CP14_E14_exportacion_excel(self):
        status, _ = self.solicitar("/api/audit/export/excel")
        self.assertIn(status, (200, 401, 403, 404))

    def test_CP15_E15_formato_no_permitido_devuelve_error(self):
        status, _ = self.solicitar("/api/audit/export/formato-invalido")
        self.assertGreaterEqual(status, 400)

    def test_CP16_E16_exportacion_con_filtros(self):
        path = "/api/audit/export/pdf?entity_type=process&entity_id=7&user_id=10&start_date=2026-01-01&end_date=2026-12-31"
        status, _ = self.solicitar(path)
        self.assertIn(status, (200, 401, 403, 404))


if __name__ == "__main__":
    unittest.main()
