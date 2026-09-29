import pytest
from assertpy import assert_that

from tests.conftest import auth_headers, create_test_action, create_test_process, create_test_user, make_token


class TestActionSearchData:
    @pytest.mark.asyncio
    async def test_action_list_includes_description_responsible_and_priority(self, client):
        leader = await create_test_user(
            name="Líder RF18", email="rf18-leader@test.com", roles="process_leader"
        )
        process = await create_test_process(
            name="Proceso RF18", created_by=leader["id"], leader_id=leader["id"]
        )
        headers = auth_headers(make_token(leader, active_role="process_leader"))
        created = await client.post(
            "/api/actions/",
            json={
                "name": "Acción prioritaria",
                "process_id": process["id"],
                "leader_id": leader["id"],
                "what": "Revisar controles críticos",
                "priority": "high",
            },
            headers=headers,
        )
        await create_test_action(
            process_id=process["id"],
            leader_id=leader["id"],
            created_by=leader["id"],
            name="Acción secundaria",
        )

        response = await client.get(
            f"/api/actions/process/{process['id']}",
            headers=headers,
        )
        actions = {item["name"]: item for item in response.json()}

        assert_that(response.status_code).is_equal_to(200)
        assert_that(created.status_code).is_equal_to(200)
        assert_that(actions["Acción prioritaria"]["what"]).is_equal_to("Revisar controles críticos")
        assert_that(actions["Acción prioritaria"]["leader_name"]).is_equal_to("Líder RF18")
        assert_that(actions["Acción prioritaria"]["priority"]).is_equal_to("high")
        assert_that(actions["Acción secundaria"]["priority"]).is_equal_to("medium")

    @pytest.mark.asyncio
    async def test_leader_cannot_read_actions_from_another_process(self, client):
        owner = await create_test_user(
            name="Dueño RF18", email="rf18-owner@test.com", roles="process_leader"
        )
        other_leader = await create_test_user(
            name="Otro RF18", email="rf18-other@test.com", roles="process_leader"
        )
        process = await create_test_process(
            name="Proceso privado RF18", created_by=owner["id"], leader_id=owner["id"]
        )
        headers = auth_headers(make_token(other_leader, active_role="process_leader"))

        response = await client.get(
            f"/api/actions/process/{process['id']}",
            headers=headers,
        )

        assert_that(response.status_code).is_equal_to(403)