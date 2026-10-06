import pytest
from httpx import AsyncClient
from pydantic import BaseModel, ValidationError
from typing import List, Optional

from tests.conftest import create_test_user, make_token, auth_headers, create_test_process, create_test_action

# -------------------------------------------------------------------------
# CONTRATOS DE DATOS (Data Contracts)
# Estos esquemas de Pydantic simulan estrictamente lo que espera 
# el frontend (React/Vue). Si el backend cambia la estructura (llaves, tipos),
# se lanzará ValidationError y el test fallará.
# -------------------------------------------------------------------------

class UserContract(BaseModel):
    id: int
    name: str
    email: str
    roles: List[str]
    is_active: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class TokenResponseContract(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    user_roles: List[str]
    active_role: str

class ProcessContract(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    status: str
    created_by: int
    leader_id: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class ActionContract(BaseModel):
    id: int
    name: str
    process_id: int
    leader_id: int
    created_by: int
    status: str
    target_date: Optional[str] = None
    completed_date: Optional[str] = None
    comments: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# -------------------------------------------------------------------------
# PRUEBAS DE REGRESIÓN DE CONTRATOS
# -------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_contract_login(client: AsyncClient):
    """
    Verifica que el contrato del JSON de respuesta al hacer login 
    cumpla estrictamente con TokenResponseContract.
    """
    password = "RegressionPassword123!"
    user = await create_test_user(password=password)
    
    response = await client.post(
        "/api/auth/login",
        data={"username": user["email"], "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 200, "El login falló"

    try:
        data = response.json()
        TokenResponseContract.model_validate(data)
    except ValidationError as e:
        pytest.fail(f"Contrato de Login roto:\n{e}")

@pytest.mark.asyncio
async def test_contract_get_me(client: AsyncClient):
    """
    Verifica que el perfil del usuario actual (Me) cumpla con la estructura de nombre e email.
    """
    user = await create_test_user()
    token = make_token(user)

    response = await client.get("/api/auth/me", headers=auth_headers(token))
    assert response.status_code == 200

    data = response.json()
    assert "email" in data, "Falta email en /api/auth/me"
    assert "name" in data, "Falta name en /api/auth/me"

@pytest.mark.asyncio
async def test_contract_get_processes(client: AsyncClient):
    """
    Verifica que la lista de procesos cumpla con una lista de ProcessContract.
    """
    user = await create_test_user()
    await create_test_process(created_by=user["id"], leader_id=user["id"])
    token = make_token(user)

    response = await client.get("/api/processes/", headers=auth_headers(token))
    assert response.status_code == 200

    try:
        data = response.json()
        assert isinstance(data, list), "El payload debe ser array"
        for item in data:
            ProcessContract.model_validate(item)
    except ValidationError as e:
        pytest.fail(f"Contrato de Procesos roto:\n{e}")

@pytest.mark.asyncio
async def test_contract_get_actions(client: AsyncClient):
    """
    Verifica que la estructura de una acción en la API cumpla con ActionContract.
    """
    user = await create_test_user(roles="admin")
    process = await create_test_process(created_by=user["id"], leader_id=user["id"])
    await create_test_action(process_id=process["id"], leader_id=user["id"], created_by=user["id"])
    
    token = make_token(user, active_role="admin")

    response = await client.get(f"/api/actions/process/{process['id']}", headers=auth_headers(token))
    assert response.status_code == 200

    try:
        data = response.json()
        assert isinstance(data, list), "Payload de acciones debe ser array"
        for item in data:
            ActionContract.model_validate(item)
    except ValidationError as e:
        pytest.fail(f"Contrato de Acción roto:\n{e}")

