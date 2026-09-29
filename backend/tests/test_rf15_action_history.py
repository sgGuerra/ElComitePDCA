import json

import pytest
from assertpy import assert_that

from tests.conftest import (
    auth_headers,
    create_test_action,
    create_test_process,
    create_test_user,
    make_token,
)


class TestActionHistory:
    @pytest.mark.asyncio
    async def test_action_detail_and_change_history_are_available_to_owner(self, client):
        leader = await create_test_user(
            name="Líder RF15", email="rf15-owner@test.com", roles="process_leader"
        )
        process = await create_test_process(
            name="Proceso RF15", created_by=leader["id"], leader_id=leader["id"]
        )
        action = await create_test_action(
            process_id=process["id"],
            leader_id=leader["id"],
            created_by=leader["id"],
            name="Acción RF15",
        )
        headers = auth_headers(make_token(leader, active_role="process_leader"))

        detail = await client.get(f"/api/actions/{action['id']}", headers=headers)
        assert_that(detail.status_code).is_equal_to(200)
        assert_that(detail.json()["name"]).is_equal_to("Acción RF15")

        update = await client.put(
            f"/api/actions/{action['id']}",
            json={"what": "Detalle actualizado", "priority": "high"},
            headers=headers,
        )
        assert_that(update.status_code).is_equal_to(200)

        history = await client.get(
            f"/api/actions/{action['id']}/history",
            headers=headers,
        )
        assert_that(history.status_code).is_equal_to(200)
        assert_that(history.json()).is_not_empty()
        latest_change = json.loads(history.json()[0]["details"])
        assert_that(latest_change["operation"]).is_equal_to("updated")
        assert_that(latest_change["changes"]).contains_key("what", "priority")

    @pytest.mark.asyncio
    async def test_unrelated_user_cannot_read_action_history(self, client):
        owner = await create_test_user(
            name="Dueño RF15", email="rf15-other-owner@test.com", roles="process_leader"
        )
        other_user = await create_test_user(
            name="Otro RF15", email="rf15-other@test.com", roles="process_leader"
        )
        process = await create_test_process(
            name="Proceso protegido", created_by=owner["id"], leader_id=owner["id"]
        )
        action = await create_test_action(
            process_id=process["id"],
            leader_id=owner["id"],
            created_by=owner["id"],
        )
        headers = auth_headers(make_token(other_user, active_role="process_leader"))

        response = await client.get(
            f"/api/actions/{action['id']}/history",
            headers=headers,
        )

        assert_that(response.status_code).is_equal_to(403)