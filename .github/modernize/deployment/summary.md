# Resumen de compatibilidad Compose en Jenkins

- Se actualizó el stage `Deploy` para detectar y usar `docker compose` (Compose V2) o `docker-compose` (ejecutable independiente), según lo disponible en el agente.
- El nombre de proyecto se pasa con `--project-name "$COMPOSE_PROJECT"`; si no se encuentra ninguna variante, el stage termina con un error explícito.
- Validación local: `docker compose config --quiet` pasó para `elcomitepdca`; ambas variantes locales informan versión 5.5.1; el archivo Jenkins no reporta errores en el editor.
- No se pudo validar el shell POSIX ni el contenedor Docker de Jenkins desde este workspace. El siguiente pipeline confirmará qué variante está instalada allí y realizará el despliegue real.
