# Plan de compatibilidad de Docker Compose en Jenkins

## Alcance
Corregir el stage `Deploy` del `Jenkinsfile`, que invoca `docker compose -p` y falla cuando el servidor Jenkins solo tiene disponible el ejecutable independiente `docker-compose` o una CLI que no incluye el plugin Compose V2.

## Diagnostico de partida
El repositorio tiene `docker-compose.yml` y construye las imágenes antes del despliegue. El error de Jenkins indica que el comando actual no está interpretando correctamente `-p`. No se puede consultar desde este workspace la versión instalada en el contenedor del servidor, así que el pipeline debe detectar las dos variantes compatibles.

## Archivos previstos
- `Jenkinsfile`: detectar si existe `docker compose` o `docker-compose`, registrar cuál se usará, y ejecutar `down`, `up -d` y `ps` con `COMPOSE_PROJECT`.

No se modificarán los Dockerfiles, el archivo Compose ni el código de la aplicación.

## Implementacion
1. En el stage `Deploy`, comprobar `docker compose version`.
2. Si no está disponible, comprobar `docker-compose --version`.
3. Si no existe ninguna variante, finalizar con un mensaje explícito.
4. Usar la variante detectada para las operaciones existentes y mantener el nombre de proyecto `elcomitepdca`.

## Validacion
- Revisar que el `Jenkinsfile` use una sintaxis de shell compatible con el agente habitual.
- Validar la estructura y sintaxis del pipeline mediante revisión estática local.
- La comprobación definitiva de la versión disponible y del despliegue requiere ejecutar el pipeline en Jenkins; no se puede simular fielmente desde este workspace.
