"""
Tests directos para el modelo de usuarios (user.py).
Cubre CRUD y búsquedas de usuarios para aumentar la cobertura.
"""

import pytest
import pytest_asyncio

from tests.conftest import (
    create_test_user,
    _test_insert,
)


class TestUserModel:

    @pytest.mark.asyncio
    async def test_get_user_by_id(self):
        from app.models.user import get_user_by_id

        user = await create_test_user(name="User", email="usr1@mod.com")
        found = await get_user_by_id(user["id"])
        assert found is not None
        assert found["email"] == "usr1@mod.com"

    @pytest.mark.asyncio
    async def test_get_user_by_id_not_found(self):
        from app.models.user import get_user_by_id
        result = await get_user_by_id(99999)
        assert result is None

    @pytest.mark.asyncio
    async def test_get_users_by_role(self):
        from app.models.user import get_users_by_role

        await create_test_user(name="User", email="usr2@mod.com", roles="admin")
        
        admins = await get_users_by_role("admin")
        assert len(admins) >= 1

    @pytest.mark.asyncio
    async def test_get_all_users(self):
        from app.models.user import get_all_users

        await create_test_user(name="User", email="usr3@mod.com")
        users = await get_all_users()
        assert len(users) >= 1

    @pytest.mark.asyncio
    async def test_update_user(self):
        from app.models.user import update_user
        from app.schemas.user import UserUpdate

        user = await create_test_user(name="User", email="usr4@mod.com")
        updated = await update_user(user["id"], UserUpdate(name="Nuevo nombre"))
        assert updated is not None
        assert updated["name"] == "Nuevo nombre"

    @pytest.mark.asyncio
    async def test_update_user_password(self):
        from app.models.user import update_user
        from app.schemas.user import UserUpdate

        user = await create_test_user(name="User", email="usr5@mod.com")
        updated = await update_user(user["id"], UserUpdate(password="NewPass123!"))
        assert updated is not None

    @pytest.mark.asyncio
    async def test_update_user_roles(self):
        from app.models.user import update_user
        from app.schemas.user import UserUpdate

        user = await create_test_user(name="User", email="usr6@mod.com", roles="process_leader")
        updated = await update_user(user["id"], UserUpdate(roles=["admin"]))
        assert updated is not None
        assert "admin" in updated["roles"]

    @pytest.mark.asyncio
    async def test_update_user_not_found(self):
        from app.models.user import update_user
        from app.schemas.user import UserUpdate

        result = await update_user(99999, UserUpdate(name="X"))
        assert result is None

    @pytest.mark.asyncio
    async def test_update_user_empty(self):
        from app.models.user import update_user
        from app.schemas.user import UserUpdate

        user = await create_test_user(name="User", email="usr7@mod.com")
        result = await update_user(user["id"], UserUpdate())
        assert result is not None

    @pytest.mark.asyncio
    async def test_delete_user(self):
        from app.models.user import delete_user

        user = await create_test_user(name="User", email="usr8@mod.com")
        result = await delete_user(user["id"])
        assert result is True

    @pytest.mark.asyncio
    async def test_delete_user_not_found(self):
        from app.models.user import delete_user
        result = await delete_user(99999)
        assert result is False

    @pytest.mark.asyncio
    async def test_deactivate_user(self):
        from app.models.user import update_user
        from app.schemas.user import UserUpdate

        user = await create_test_user(name="User", email="usr9@mod.com")
        result = await update_user(user["id"], UserUpdate(is_active=False))
        assert result is not None

        from app.models.user import get_user_by_id
        deactivated = await get_user_by_id(user["id"])
        assert deactivated["is_active"] == False

    @pytest.mark.asyncio
    async def test_deactivate_user_not_found(self):
        from app.models.user import update_user
        from app.schemas.user import UserUpdate
        result = await update_user(99999, UserUpdate(is_active=False))
        assert result is None
