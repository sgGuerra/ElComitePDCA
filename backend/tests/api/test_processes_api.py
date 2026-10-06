"""Pruebas de API de obtención de recursos: procesos PDCA."""

import pytest
from fastapi import status
from hamcrest import assert_that, equal_to, has_entries

pytestmark = pytest.mark.anyio

PROCESS_URL = "/api/processes/{process_id}"


async def test_obtener_proceso_existente_como_admin(
    client, admin_user, process_seeder, override_current_user
):
    process = await process_seeder.create(owner=admin_user, name="Gestión de Calidad")
    override_current_user(admin_user.as_principal())

    response = await client.get(PROCESS_URL.format(process_id=process["id"]))

    assert_that(response.status_code, equal_to(status.HTTP_200_OK))
    assert_that(
        response.json(),
        has_entries(
            id=process["id"],
            name="Gestión de Calidad",
            created_by=admin_user.id,
            owner=admin_user.name,
            total_actions=0,
            pending_actions=0,
        ),
    )
