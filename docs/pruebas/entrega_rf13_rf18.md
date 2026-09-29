# Entrega individual: RF-13 a RF-18

## Alcance y estado

| Requisito | Escenarios | Cobertura implementada |
| --- | --- | --- |
| RF-13 Historial de notificaciones | E01-E03 | API devuelve solo notificaciones del usuario autenticado; devuelve lista vacía cuando no hay registros. La ruta `/perfil/notificaciones` ahora muestra el historial y estado vacío. |
| RF-14 Historial de procesos para administrador | E04-E09 | El administrador consulta procesos y estados. La pantalla busca por nombre, descripción y propietario, muestra estado, navega a acciones/estadísticas y muestra estado vacío cuando no hay resultados. |
| RF-15 Detalle e historial de cambios de acción | E10-E12 | El detalle conserva los permisos existentes. Los cambios quedan registrados y `/api/actions/{id}/history` solo es accesible para administrador, creador o líder de la acción. |
| RF-16 Exportación de registros | E13-E16 | Registros de cambios de acciones/procesos consultables por filtro; descarga PDF, Excel y CSV; formato inválido y usuario no administrador se rechazan. |
| RF-17 Verificación del historial por auditor | E17-E20 | El auditor consulta procesos `pending_audit`, crea informes asociados a su usuario y consulta sus propios informes; usuarios sin rol auditor reciben 403. |
| RF-18 Búsqueda avanzada de acciones | E21-E25 | La lista permite buscar por nombre, descripción o responsable y combinar texto, estado y prioridad; incluye estado sin resultados y conserva la restricción de acceso por proceso. La prioridad ya se persiste y devuelve desde la API. |

La carpeta de pruebas contiene seis suites backend con aserciones encadenadas de Python `assertpy` y pruebas de interfaz con Vitest/Testing Library. El formato Python usado es, por ejemplo, `assert_that(response.status_code).is_equal_to(200)`. Las pruebas de interfaz usan las aserciones idiomáticas de Vitest.

## Archivos de prueba

- RF-13: `backend/tests/test_rf13_notifications_history.py`, `frontend/src/pages/NotificationsHistory.test.jsx`
- RF-14: `backend/tests/test_rf14_process_history.py`, `frontend/src/pages/ProcessList.test.jsx`
- RF-15: `backend/tests/test_rf15_action_history.py`
- RF-16: `backend/tests/test_rf16_export_logs.py`, `frontend/src/services/auditService.test.js`
- RF-17: `backend/tests/test_rf17_auditor_review.py`, `backend/tests/test_audit_endpoints.py`
- RF-18: `backend/tests/test_rf18_action_search.py`, `frontend/src/pages/ActionsList.test.jsx`

## Ejecución local

Desde PowerShell, en la raíz del repositorio:

```powershell
npm ci --prefix frontend
npm --prefix frontend run test:cov
npm --prefix frontend run build
```

Pruebas backend de los seis requisitos:

```powershell
Push-Location backend
python -m pytest tests/test_rf13_notifications_history.py tests/test_rf14_process_history.py tests/test_rf15_action_history.py tests/test_rf16_export_logs.py tests/test_rf17_auditor_review.py tests/test_rf18_action_search.py -v
Pop-Location
```

Suite backend completa con cobertura para SonarQube:

```powershell
Push-Location backend
python -m pytest tests/ -v --cov=app --cov-report=xml
Pop-Location
```

## Docker

El `docker-compose.yml` publica el frontend en `http://localhost` y FastAPI en `http://localhost:8000`.

```powershell
docker compose up --build -d
docker compose ps
Invoke-WebRequest http://localhost:8000/health
```

Para detener la demostración:

```powershell
docker compose down
```

La base SQLite persiste en el volumen `sqlite-data`; no ejecutar `docker compose down -v` si se necesita conservar esos datos.

## Jenkins y SonarQube

El `Jenkinsfile` usa `checkout scm`, por lo que construye la rama configurada en el job en lugar de forzar `test/dev`. El pipeline instala dependencias, ejecuta las suites completas, genera cobertura y reportes JUnit, analiza SonarQube, exige Quality Gate aprobado y luego construye/despliega con Docker Compose.

Antes de la demostración, confirmar en Jenkins:

- Agente Linux con Docker y plugin Docker Compose disponible.
- Herramienta global de SonarScanner llamada `SonarScanner`.
- Instalación global SonarQube llamada `SonarQube`, con credencial/token válido.
- Webhook de SonarQube apuntando a `https://<jenkins>/sonarqube-webhook/` para que `waitForQualityGate()` responda.
- Job apuntando a la rama individual que se va a sustentar; el pipeline toma ese checkout mediante `scm`.

Jenkins publica `backend/coverage.xml`, `frontend/coverage/lcov.info` y los resultados JUnit de ambos lenguajes. Las pruebas y el build deben quedar verdes antes de mostrar las etapas SonarQube y Docker.

## Evidencia para la sustentación

1. Mostrar el job Jenkins y la rama/commit ejecutados.
2. Abrir las etapas backend/frontend y sus reportes JUnit; señalar las pruebas `test_rf13` a `test_rf18`.
3. Mostrar en una prueba un encadenamiento `assert_that(...).is_equal_to(...)` y explicar qué resultado protege.
4. Mostrar SonarQube: análisis del commit y Quality Gate.
5. Mostrar imágenes/servicios Docker activos y abrir `http://localhost`, `/health` y `/docs`.
6. Demostrar RF-13 historial y lista vacía; RF-14 búsqueda/estado/navegación; RF-15 historial y 403 con otro usuario; RF-16 filtros y descargas PDF/Excel; RF-17 acceso auditor; RF-18 combinación de búsqueda, estado y prioridad.
7. Para regresión, explicar que Jenkins ejecuta toda la suite después de cada cambio y enseñar una ejecución verde posterior a una modificación.

## Notas

- Las marcas de tiempo de auditoría se guardan en UTC. Los filtros de fecha se comparan por día calendario del registro.
- Los comentarios sobre informes de auditoría siguen sin endpoint; esa función no está entre los escenarios RF-13 a RF-18.
- La prueba de flujo `request-audit` cambia un proceso a `pending_audit`; el endpoint de descarga individual de PDF de informes de auditoría sigue marcado como desarrollo. RF-16 exporta los registros de auditoría generales, que es un flujo distinto.
- La instalación frontend reportó tres vulnerabilidades moderadas en dependencias transitivas; no se aplicó `npm audit fix --force` para evitar actualizaciones mayores automáticas.
