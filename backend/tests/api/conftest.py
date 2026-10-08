"""
Configuración compartida de la suite de pruebas de API (aislada).

Cada bloque tiene una única responsabilidad (SRP) y las pruebas dependen de
fixtures, no de detalles de implementación (DIP):

- Entorno: ``SECRET_KEY`` de prueba y base SQLite temporal por prueba.
- Ciclo de vida: la app real arranca con un *lifespan* de prueba (solo
  ``init_db``), conducido explícitamente con ``async with``.
- Transporte: ``httpx2.AsyncClient`` en memoria vía ``ASGITransport``.
- JWT simulado: ``TokenFactory`` firma tokens con la clave de prueba (ejercita
  el ``get_current_user`` real) y ``override_current_user`` lo sustituye
  cuando solo interesa el recurso.
- Datos: ``UserSeeder`` y ``ProcessSeeder`` usan la capa de modelos de la app.

Las pruebas asíncronas corren con el plugin de pytest de AnyIO (dependencia
transitiva de FastAPI y httpx2); no se requiere pytest-asyncio.
"""

from __future__ import annotations

from collections.abc import AsyncIterator, Callable, Iterator
from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import httpx2
import pytest
from fastapi import FastAPI
from jose import jwt

from app.core.auth import get_current_user
from app.core.config import settings
from app.db.init_db import init_db
from app.main import app as fastapi_app
from app.models.process import create_process
from app.models.user import create_user
from app.schemas.process import ProcessCreate
from app.schemas.user import UserCreate

TEST_SECRET_KEY = "el-comite-api-tests-secret-key"
JWT_ALGORITHM = "HS256"
BASE_URL = "http://testserver"
DEFAULT_PASSWORD = "Password123!"

Principal = dict[str, Any]


# ---------------------------------------------------------------------------
# Objetos de apoyo
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class SeededUser:
    """Usuario persistido en la BD de prueba junto con su contraseña en claro."""

    id: int
    name: str
    email: str
    password: str
    roles: tuple[str, ...]

    @property
    def active_role(self) -> str:
        return self.roles[0]

    def as_principal(self, active_role: str | None = None) -> Principal:
        """Forma del usuario que ``get_current_user`` inyecta en los endpoints."""
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "roles": list(self.roles),
            "active_role": active_role or self.active_role,
            "is_active": True,
        }


class TokenFactory:
    """Emite JWT simulados con el mismo contrato de claims que la app."""

    def __init__(self, secret_key: str, algorithm: str = JWT_ALGORITHM) -> None:
        self._secret_key = secret_key
        self._algorithm = algorithm

    def issue(
        self,
        user: SeededUser,
        *,
        active_role: str | None = None,
        expires_in: timedelta = timedelta(minutes=15),
    ) -> str:
        """Firma un token; un ``expires_in`` negativo produce un token vencido."""
        claims = {
            "sub": str(user.id),
            "exp": datetime.now(timezone.utc) + expires_in,
            "email": user.email,
            "name": user.name,
            "roles": list(user.roles),
            "active_role": active_role or user.active_role,
        }
        return jwt.encode(claims, self._secret_key, algorithm=self._algorithm)

    def decode(self, token: str) -> dict[str, Any]:
        return jwt.decode(token, self._secret_key, algorithms=[self._algorithm])

    @staticmethod
    def bearer(token: str) -> dict[str, str]:
        return {"Authorization": f"Bearer {token}"}


class UserSeeder:
    """Crea usuarios a través de la capa de modelos (sin SQL crudo)."""

    async def create(
        self,
        *,
        name: str = "Usuario de Prueba",
        email: str = "usuario@test.com",
        password: str = DEFAULT_PASSWORD,
        roles: tuple[str, ...] = (settings.ROLE_PROCESS_LEADER,),
    ) -> SeededUser:
        record = await create_user(
            UserCreate(name=name, email=email, password=password, roles=list(roles))
        )
        return SeededUser(
            id=record["id"],
            name=record["name"],
            email=record["email"],
            password=password,
            roles=tuple(record["roles"]),
        )


class ProcessSeeder:
    """Crea procesos PDCA a través de la capa de modelos."""

    async def create(
        self,
        *,
        owner: SeededUser,
        name: str = "Proceso de Prueba",
        description: str = "Descripción de prueba",
    ) -> dict[str, Any]:
        process_in = ProcessCreate(name=name, description=description, leader_id=owner.id)
        return await create_process(process_in, owner.id)


@asynccontextmanager
async def isolated_lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Lifespan de prueba: crea el esquema sin ``create_admin``/``seed_db``,
    que escriben sobre la base de datos real del proyecto."""
    await init_db()
    yield


# ---------------------------------------------------------------------------
# Entorno y ciclo de vida
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def anyio_backend() -> str:
    """Backend de AnyIO para todas las pruebas y fixtures asíncronas."""
    return "asyncio"


@pytest.fixture
def api_settings(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    """Clave JWT y BD SQLite temporales; monkeypatch restaura los valores."""
    db_file = tmp_path / "el_comite_test.sqlite"
    monkeypatch.setattr(settings, "SECRET_KEY", TEST_SECRET_KEY)
    monkeypatch.setattr(settings, "DATABASE_URL", f"sqlite:///{db_file.as_posix()}")
    return settings


@pytest.fixture
async def api_app(
    anyio_backend: str,
    api_settings,
    monkeypatch: pytest.MonkeyPatch,
) -> AsyncIterator[FastAPI]:
    """App FastAPI real con su ciclo de vida asíncrono (startup/shutdown)."""
    monkeypatch.setattr(fastapi_app.router, "lifespan_context", isolated_lifespan)
    try:
        async with fastapi_app.router.lifespan_context(fastapi_app):
            yield fastapi_app
    finally:
        fastapi_app.dependency_overrides.clear()


@pytest.fixture
async def client(api_app: FastAPI) -> AsyncIterator[httpx2.AsyncClient]:
    """Cliente HTTP asíncrono en memoria; no levanta un servidor real."""
    transport = httpx2.ASGITransport(app=api_app)
    async with httpx2.AsyncClient(transport=transport, base_url=BASE_URL) as http_client:
        yield http_client


# ---------------------------------------------------------------------------
# Simulación de JWT
# ---------------------------------------------------------------------------

@pytest.fixture
def token_factory(api_settings) -> TokenFactory:
    """Tokens firmados con la clave de prueba que la app usa para validar."""
    return TokenFactory(secret_key=api_settings.SECRET_KEY)


@pytest.fixture
def override_current_user(api_app: FastAPI) -> Iterator[Callable[[Principal], None]]:
    """Sustituye ``get_current_user`` para inyectar un principal sin JWT."""

    def _override(principal: Principal) -> None:
        api_app.dependency_overrides[get_current_user] = lambda: principal

    yield _override
    api_app.dependency_overrides.pop(get_current_user, None)


# ---------------------------------------------------------------------------
# Datos de prueba
# ---------------------------------------------------------------------------

@pytest.fixture
def user_seeder(api_app: FastAPI) -> UserSeeder:
    return UserSeeder()


@pytest.fixture
def process_seeder(api_app: FastAPI) -> ProcessSeeder:
    return ProcessSeeder()


@pytest.fixture
async def leader_user(user_seeder: UserSeeder) -> SeededUser:
    return await user_seeder.create(
        name="Líder de Proceso",
        email="lider.pruebas@elcomite.org",
        roles=(settings.ROLE_PROCESS_LEADER,),
    )


@pytest.fixture
async def admin_user(user_seeder: UserSeeder) -> SeededUser:
    return await user_seeder.create(
        name="Administrador PDCA",
        email="admin.pruebas@elcomite.org",
        roles=(settings.ROLE_ADMIN, settings.ROLE_PROCESS_LEADER),
    )
