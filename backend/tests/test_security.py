import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta, timezone
from jose import jwt

from app.core.config import settings
from tests.conftest import create_test_user, make_token, auth_headers

pytestmark = pytest.mark.asyncio

class TestSecurityEndpoints:
    
    async def test_jwt_bypass_no_token(self, client: AsyncClient):
        """Prueba que los endpoints protegidos rechacen peticiones sin token"""
        response = await client.get("/api/users/")
        assert response.status_code == 401
        assert response.json() == {"detail": "Not authenticated"}

    async def test_jwt_bypass_expired_token(self, client: AsyncClient):
        """Prueba que un token expirado sea rechazado"""
        user = await create_test_user()
        
        # Generar un token ya expirado
        expire = datetime.now(timezone.utc) - timedelta(minutes=10)
        to_encode = {
            "exp": expire, 
            "sub": str(user["id"]),
            "email": user["email"],
            "name": user["name"],
            "roles": user["roles"],
            "active_role": user["roles"][0]
        }
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
        
        response = await client.get("/api/users/process-leaders", headers={"Authorization": f"Bearer {encoded_jwt}"})
        assert response.status_code == 401
        assert "Token expired" in response.json().get("detail", "")

    async def test_jwt_bypass_invalid_signature(self, client: AsyncClient):
        """Prueba que un token firmado con otra clave sea rechazado"""
        user = await create_test_user(email="test2@example.com")
        
        expire = datetime.now(timezone.utc) + timedelta(minutes=10)
        to_encode = {
            "exp": expire, 
            "sub": str(user["id"]),
        }
        # Firmar con clave secreta incorrecta
        encoded_jwt = jwt.encode(to_encode, "CLAVE_FALSA_MALICIOSA", algorithm="HS256")
        
        response = await client.get("/api/users/process-leaders", headers={"Authorization": f"Bearer {encoded_jwt}"})
        assert response.status_code == 401
        assert "Could not validate credentials" in response.json().get("detail", "")

    async def test_rbac_access_control(self, client: AsyncClient):
        """Prueba que un usuario sin rol de admin no pueda acceder a endpoints de admin"""
        # Crear un process_leader normal
        leader_user = await create_test_user(roles=settings.ROLE_PROCESS_LEADER, email="leader@example.com")
        token = make_token(leader_user)
        
        # Intentar acceder al endpoint GET /api/users/ (solo admins)
        response = await client.get("/api/users/", headers=auth_headers(token))
        assert response.status_code == 403
        assert "No tienes el rol requerido" in response.json().get("detail", "")

    async def test_pydantic_mass_payload_injection(self, client: AsyncClient):
        """Prueba de inyección de payload masivo (Schema Validation)"""
        # Crear un admin para tener permisos
        admin_user = await create_test_user(roles=settings.ROLE_ADMIN, email="admin_sec@test.com")
        token = make_token(admin_user)
        
        # Construir un payload excesivo para evaluar la validación estricta de Pydantic
        huge_payload = {
            "name": "A" * 10000,  # String gigante
            "email": "inyeccion@masiva.com",
            "password": "Password123!",
            "roles": [settings.ROLE_PROCESS_LEADER],
            "extra_field_malicious": "DROP TABLE users;" * 1000  # Campos no permitidos
        }
        
        response = await client.post("/api/users/", json=huge_payload, headers=auth_headers(token))
        
        # FastAPI / Pydantic debe rechazar este request antes de que llegue a la BD
        # Retorna 422 Unprocessable Entity
        assert response.status_code == 422
