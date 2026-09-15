"""
Tests para modelos de recursos (resource.py).
Cubre CRUD de recursos y control de permisos.
"""

import pytest
import pytest_asyncio
import io
from fastapi import UploadFile

from tests.conftest import (
    create_test_user,
    create_test_process,
    create_test_action,
    _test_insert,
)


class TestResourceModel:

    @pytest.mark.asyncio
    async def test_create_resource(self):
        from app.models.resource import add_resource_to_action

        admin = await create_test_user(name="Admin", email="admin@res.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])

        file = UploadFile(filename="test.txt", file=io.BytesIO(b"dummy"), size=5, headers={"content-type": "text/plain"})
        
        resource = await add_resource_to_action(action["id"], file, admin["id"])
        
        assert resource is not None
        assert resource["filename"] == "test.txt"

    @pytest.mark.asyncio
    async def test_get_resource_by_id(self):
        from app.models.resource import add_resource_to_action, get_resource_by_id

        admin = await create_test_user(name="Admin", email="admin@res2.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])

        file = UploadFile(filename="test.txt", file=io.BytesIO(b"dummy"), size=5, headers={"content-type": "text/plain"})
        resource = await add_resource_to_action(action["id"], file, admin["id"])

        found = await get_resource_by_id(resource["id"])
        assert found is not None
        assert found["id"] == resource["id"]

    @pytest.mark.asyncio
    async def test_get_resource_not_found(self):
        from app.models.resource import get_resource_by_id
        result = await get_resource_by_id(99999)
        assert result is None

    @pytest.mark.asyncio
    async def test_get_resources_by_action(self):
        from app.models.resource import add_resource_to_action, get_action_resources

        admin = await create_test_user(name="Admin", email="admin@res3.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])

        file1 = UploadFile(filename="test1.txt", file=io.BytesIO(b"dummy1"), size=6, headers={"content-type": "text/plain"})
        file2 = UploadFile(filename="test2.txt", file=io.BytesIO(b"dummy2"), size=6, headers={"content-type": "text/plain"})
        await add_resource_to_action(action["id"], file1, admin["id"])
        await add_resource_to_action(action["id"], file2, admin["id"])

        resources = await get_action_resources(action["id"])
        assert len(resources) >= 2

    @pytest.mark.asyncio
    async def test_delete_resource(self):
        from app.models.resource import add_resource_to_action, delete_action_resource

        admin = await create_test_user(name="Admin", email="admin@res4.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])

        file = UploadFile(filename="test.txt", file=io.BytesIO(b"dummy"), size=5, headers={"content-type": "text/plain"})
        resource = await add_resource_to_action(action["id"], file, admin["id"])
        
        result = await delete_action_resource(resource["id"])
        assert result is True

    @pytest.mark.asyncio
    async def test_delete_resource_not_found(self):
        from app.models.resource import delete_action_resource
        result = await delete_action_resource(99999)
        assert result is False
