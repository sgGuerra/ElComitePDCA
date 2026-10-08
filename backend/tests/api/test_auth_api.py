"""Pruebas de API de autenticación: emisión y consumo de JWT."""

import pytest
from fastapi import status
from hamcrest import assert_that, contains_exactly, equal_to, has_entries, has_item

pytestmark = pytest.mark.anyio

LOGIN_URL = "/api/auth/login"
ME_URL = "/api/auth/me"


async def test_login_con_credenciales_validas_emite_jwt(client, leader_user, token_factory):
    response = await client.post(
        LOGIN_URL,
        data={"username": leader_user.email, "password": leader_user.password},
    )

    assert_that(response.status_code, equal_to(status.HTTP_200_OK))
    body = response.json()
    assert_that(
        body,
        has_entries(
            token_type="bearer",
            user_id=leader_user.id,
            user_roles=contains_exactly(*leader_user.roles),
            active_role=leader_user.active_role,
        ),
    )
    # El token debe estar firmado con la SECRET_KEY configurada para el entorno.
    assert_that(
        token_factory.decode(body["access_token"]),
        has_entries(sub=str(leader_user.id), email=leader_user.email),
    )


async def test_me_con_jwt_simulado_devuelve_usuario_autenticado(
    client, leader_user, token_factory
):
    token = token_factory.issue(leader_user)

    response = await client.get(ME_URL, headers=token_factory.bearer(token))

    assert_that(response.status_code, equal_to(status.HTTP_200_OK))
    assert_that(
        response.json(),
        has_entries(
            id=leader_user.id,
            name=leader_user.name,
            email=leader_user.email,
            roles=has_item(leader_user.active_role),
            is_active=True,
        ),
    )
