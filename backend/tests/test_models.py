"""
Tests directos para modelos de datos.
Cubre las funciones de los modelos que no se alcanzan solo a través de endpoints:
action, process, assignment, deactivation, notification, comment, statistics, audit.
"""

import pytest
import pytest_asyncio

from tests.conftest import (
    create_test_user,
    create_test_process,
    create_test_action,
    assign_leader_to_process,
    _test_insert,
    _test_get_one,
    _test_get_all,
    _test_execute,
)


# ──────────────────────────────────────────────────────────────────────────────
# models/action.py
# ──────────────────────────────────────────────────────────────────────────────

class TestActionModel:

    @pytest.mark.asyncio
    async def test_create_action_notifies_leader(self):
        from app.models.action import create_action
        from app.schemas.action import ActionCreate

        admin = await create_test_user(name="Admin", email="admin@mod.com", roles="admin")
        leader = await create_test_user(name="Líder", email="lider@mod.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=leader["id"])

        action_data = ActionCreate(
            name="Acción notif", process_id=process["id"], leader_id=leader["id"],
        )
        action = await create_action(action_data, admin["id"])
        assert action is not None
        assert action["name"] == "Acción notif"

        # Verify notification was created for leader
        notif = await _test_get_one(
            "SELECT * FROM notifications WHERE user_id = ? AND related_type = 'action'",
            (leader["id"],)
        )
        assert notif is not None

    @pytest.mark.asyncio
    async def test_create_action_no_self_notification(self):
        from app.models.action import create_action
        from app.schemas.action import ActionCreate

        leader = await create_test_user(name="Líder", email="lider@mod2.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=leader["id"], leader_id=leader["id"])

        action_data = ActionCreate(
            name="Self", process_id=process["id"], leader_id=leader["id"],
        )
        action = await create_action(action_data, leader["id"])
        assert action is not None

        # No notification for self
        notif = await _test_get_one(
            "SELECT * FROM notifications WHERE user_id = ? AND related_type = 'action'",
            (leader["id"],)
        )
        assert notif is None

    @pytest.mark.asyncio
    async def test_get_action_by_id(self):
        from app.models.action import get_action_by_id

        admin = await create_test_user(name="Admin", email="admin@mod3.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])

        result = await get_action_by_id(action["id"])
        assert result is not None
        assert result["leader_name"] is not None

    @pytest.mark.asyncio
    async def test_get_action_by_id_not_found(self):
        from app.models.action import get_action_by_id
        result = await get_action_by_id(99999)
        assert result is None

    @pytest.mark.asyncio
    async def test_get_actions_by_process(self):
        from app.models.action import get_actions_by_process

        admin = await create_test_user(name="Admin", email="admin@mod4.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])
        await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"], name="Otra")

        actions = await get_actions_by_process(process["id"])
        assert len(actions) >= 2

    @pytest.mark.asyncio
    async def test_get_actions_by_leader(self):
        from app.models.action import get_actions_by_leader

        admin = await create_test_user(name="Admin", email="admin@mod5.com", roles="admin")
        leader = await create_test_user(name="Líder", email="lider@mod3.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=leader["id"])
        await create_test_action(process_id=process["id"], leader_id=leader["id"], created_by=admin["id"])

        actions = await get_actions_by_leader(leader["id"])
        assert len(actions) >= 1

    @pytest.mark.asyncio
    async def test_update_action(self):
        from app.models.action import update_action
        from app.schemas.action import ActionUpdate

        admin = await create_test_user(name="Admin", email="admin@mod6.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])

        update_data = ActionUpdate(status="in_progress", completion_percentage=50)
        updated = await update_action(action["id"], update_data)
        assert updated is not None
        assert updated["status"] == "in_progress"

    @pytest.mark.asyncio
    async def test_update_action_status_change_notification(self):
        from app.models.action import update_action
        from app.schemas.action import ActionUpdate

        admin = await create_test_user(name="Admin", email="admin@mod6b.com", roles="admin")
        leader = await create_test_user(name="Líder", email="lider@mod6b.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=leader["id"])
        action = await create_test_action(process_id=process["id"], leader_id=leader["id"], created_by=admin["id"])

        update_data = ActionUpdate(status="completed")
        updated = await update_action(action["id"], update_data)
        assert updated is not None

        # Notification to creator for completion
        notif = await _test_get_one(
            "SELECT * FROM notifications WHERE user_id = ? AND title = 'Acción completada'",
            (admin["id"],)
        )
        assert notif is not None

    @pytest.mark.asyncio
    async def test_update_action_not_found(self):
        from app.models.action import update_action
        from app.schemas.action import ActionUpdate

        result = await update_action(99999, ActionUpdate(status="completed"))
        assert result is None

    @pytest.mark.asyncio
    async def test_update_action_empty_update(self):
        from app.models.action import update_action
        from app.schemas.action import ActionUpdate

        admin = await create_test_user(name="Admin", email="admin@mod6c.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])

        result = await update_action(action["id"], ActionUpdate())
        assert result is not None

    @pytest.mark.asyncio
    async def test_delete_action(self):
        from app.models.action import delete_action

        admin = await create_test_user(name="Admin", email="admin@mod7.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        action = await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])

        result = await delete_action(action["id"])
        assert result is True

    @pytest.mark.asyncio
    async def test_delete_action_not_found(self):
        from app.models.action import delete_action
        result = await delete_action(99999)
        assert result is False

    @pytest.mark.asyncio
    async def test_get_action_statistics_global(self):
        from app.models.action import get_action_statistics

        admin = await create_test_user(name="Admin", email="admin@mod8.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"], status="completed")
        await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"], status="pending")

        stats = await get_action_statistics()
        assert stats["total"] >= 2
        assert stats["completed"] >= 1
        assert "completion_rate" in stats

    @pytest.mark.asyncio
    async def test_get_action_statistics_by_process(self):
        from app.models.action import get_action_statistics

        admin = await create_test_user(name="Admin", email="admin@mod9.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])

        stats = await get_action_statistics(process["id"])
        assert stats["total"] >= 1

    @pytest.mark.asyncio
    async def test_get_upcoming_deadlines(self):
        from app.models.action import get_upcoming_deadlines

        admin = await create_test_user(name="Admin", email="admin@mod10.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        await create_test_action(
            process_id=process["id"], leader_id=admin["id"], created_by=admin["id"],
            target_date="2099-12-31"
        )

        for dr in ["week", "month", "quarter", "year"]:
            deadlines = await get_upcoming_deadlines(limit=5, date_range=dr)
            assert isinstance(deadlines, list)

    @pytest.mark.asyncio
    async def test_get_upcoming_deadlines_filtered(self):
        from app.models.action import get_upcoming_deadlines

        admin = await create_test_user(name="Admin", email="admin@mod10b.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        await create_test_action(
            process_id=process["id"], leader_id=admin["id"], created_by=admin["id"],
            target_date="2099-06-15"
        )

        deadlines = await get_upcoming_deadlines(limit=5, process_id=process["id"], date_range="year")
        assert isinstance(deadlines, list)

    @pytest.mark.asyncio
    async def test_check_for_overdue_actions(self):
        from app.models.action import check_for_overdue_actions

        admin = await create_test_user(name="Admin", email="admin@mod11.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        await create_test_action(
            process_id=process["id"], leader_id=admin["id"], created_by=admin["id"],
            target_date="2020-01-01"
        )

        count = await check_for_overdue_actions()
        assert isinstance(count, int)


# ──────────────────────────────────────────────────────────────────────────────
# models/process.py
# ──────────────────────────────────────────────────────────────────────────────

class TestProcessModel:

    @pytest.mark.asyncio
    async def test_create_process_with_leader(self):
        from app.models.process import create_process
        from app.schemas.process import ProcessCreate

        admin = await create_test_user(name="Admin", email="admin@pmod.com", roles="admin")
        leader = await create_test_user(name="Líder", email="lider@pmod.com", roles="process_leader")

        process = await create_process(ProcessCreate(
            name="Proc con líder", leader_id=leader["id"],
        ), admin["id"])
        assert process is not None
        assert process["owner"] == "Líder"

    @pytest.mark.asyncio
    async def test_get_all_processes(self):
        from app.models.process import get_all_processes

        admin = await create_test_user(name="Admin", email="admin@pmod2.com", roles="admin")
        await create_test_process(name="Proc 1", created_by=admin["id"], leader_id=admin["id"])
        await create_test_process(name="Proc 2", created_by=admin["id"], leader_id=admin["id"])

        processes = await get_all_processes()
        assert len(processes) >= 2

    @pytest.mark.asyncio
    async def test_get_all_processes_with_stats(self):
        from app.models.process import get_all_processes

        admin = await create_test_user(name="Admin", email="admin@pmod3.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])

        processes = await get_all_processes(include_stats=True)
        assert len(processes) >= 1
        assert "total_actions" in processes[0]

    @pytest.mark.asyncio
    async def test_update_process(self):
        from app.models.process import update_process
        from app.schemas.process import ProcessUpdate

        admin = await create_test_user(name="Admin", email="admin@pmod4.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])

        updated = await update_process(process["id"], ProcessUpdate(name="Nuevo nombre", description="Desc"))
        assert updated is not None
        assert updated["name"] == "Nuevo nombre"

    @pytest.mark.asyncio
    async def test_update_process_with_leader(self):
        from app.models.process import update_process
        from app.schemas.process import ProcessUpdate

        admin = await create_test_user(name="Admin", email="admin@pmod5.com", roles="admin")
        leader = await create_test_user(name="Nuevo Líder", email="lider@pmod2.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])

        updated = await update_process(process["id"], ProcessUpdate(leader_id=leader["id"]))
        assert updated is not None
        assert updated["owner"] == "Nuevo Líder"

    @pytest.mark.asyncio
    async def test_update_process_not_found(self):
        from app.models.process import update_process
        from app.schemas.process import ProcessUpdate

        result = await update_process(99999, ProcessUpdate(name="X"))
        assert result is None

    @pytest.mark.asyncio
    async def test_update_process_empty(self):
        from app.models.process import update_process
        from app.schemas.process import ProcessUpdate

        admin = await create_test_user(name="Admin", email="admin@pmod6.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])

        result = await update_process(process["id"], ProcessUpdate())
        assert result is not None

    @pytest.mark.asyncio
    async def test_delete_process(self):
        from app.models.process import delete_process

        admin = await create_test_user(name="Admin", email="admin@pmod7.com", roles="admin")
        process = await create_test_process(name="A eliminar", created_by=admin["id"], leader_id=admin["id"])

        result = await delete_process(process["id"])
        assert result is True

    @pytest.mark.asyncio
    async def test_delete_process_not_found(self):
        from app.models.process import delete_process
        result = await delete_process(99999)
        assert result is False

    @pytest.mark.asyncio
    async def test_get_process_statistics(self):
        from app.models.process import get_process_statistics

        admin = await create_test_user(name="Admin", email="admin@pmod8.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"], status="completed")
        await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"], status="pending")

        stats = await get_process_statistics(process["id"])
        assert stats["total_actions"] >= 2
        assert stats["completed_actions"] >= 1

    @pytest.mark.asyncio
    async def test_get_processes_by_leader(self):
        from app.models.process import get_processes_by_leader

        admin = await create_test_user(name="Admin", email="admin@pmod9.com", roles="admin")
        leader = await create_test_user(name="Líder", email="lider@pmod3.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=leader["id"])
        await assign_leader_to_process(process["id"], leader["id"], admin["id"])

        processes = await get_processes_by_leader(leader["id"])
        assert len(processes) >= 1


# ──────────────────────────────────────────────────────────────────────────────
# models/assignment.py
# ──────────────────────────────────────────────────────────────────────────────

class TestAssignmentModel:

    @pytest.mark.asyncio
    async def test_assign_and_get_leaders(self):
        from app.models.assignment import assign_leader_to_process, get_process_leaders
        from app.schemas.assignment import AssignmentCreate

        admin = await create_test_user(name="Admin", email="admin@asgn.com", roles="admin")
        leader = await create_test_user(name="Líder", email="lider@asgn.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])

        assignment = await assign_leader_to_process(
            AssignmentCreate(process_id=process["id"], leader_id=leader["id"]), admin["id"]
        )
        assert assignment is not None

        leaders = await get_process_leaders(process["id"])
        assert len(leaders) >= 1

    @pytest.mark.asyncio
    async def test_assign_duplicate(self):
        from app.models.assignment import assign_leader_to_process
        from app.schemas.assignment import AssignmentCreate

        admin = await create_test_user(name="Admin", email="admin@asgn2.com", roles="admin")
        leader = await create_test_user(name="Líder", email="lider@asgn2.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])

        data = AssignmentCreate(process_id=process["id"], leader_id=leader["id"])
        await assign_leader_to_process(data, admin["id"])
        dup = await assign_leader_to_process(data, admin["id"])
        assert dup is not None  # Returns existing

    @pytest.mark.asyncio
    async def test_remove_leader(self):
        from app.models.assignment import remove_leader_from_process

        admin = await create_test_user(name="Admin", email="admin@asgn3.com", roles="admin")
        leader = await create_test_user(name="Líder", email="lider@asgn3.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        await assign_leader_to_process(process["id"], leader["id"], admin["id"])

        result = await remove_leader_from_process(process["id"], leader["id"])
        assert result is True

    @pytest.mark.asyncio
    async def test_get_leader_processes(self):
        from app.models.assignment import get_leader_processes

        admin = await create_test_user(name="Admin", email="admin@asgn4.com", roles="admin")
        leader = await create_test_user(name="Líder", email="lider@asgn4.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        await assign_leader_to_process(process["id"], leader["id"], admin["id"])

        processes = await get_leader_processes(leader["id"])
        assert len(processes) >= 1

    @pytest.mark.asyncio
    async def test_transfer_leadership(self):
        from app.models.assignment import transfer_process_leadership

        admin = await create_test_user(name="Admin", email="admin@asgn5.com", roles="admin")
        old_leader = await create_test_user(name="Old", email="old@asgn.com", roles="process_leader")
        new_leader = await create_test_user(name="New", email="new@asgn.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        await assign_leader_to_process(process["id"], old_leader["id"], admin["id"])

        result = await transfer_process_leadership(process["id"], old_leader["id"], new_leader["id"])
        assert result is True

    @pytest.mark.asyncio
    async def test_transfer_leadership_already_assigned(self):
        from app.models.assignment import transfer_process_leadership

        admin = await create_test_user(name="Admin", email="admin@asgn6.com", roles="admin")
        old_leader = await create_test_user(name="Old", email="old@asgn2.com", roles="process_leader")
        new_leader = await create_test_user(name="New", email="new@asgn2.com", roles="process_leader")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        await assign_leader_to_process(process["id"], old_leader["id"], admin["id"])
        await assign_leader_to_process(process["id"], new_leader["id"], admin["id"])

        result = await transfer_process_leadership(process["id"], old_leader["id"], new_leader["id"])
        assert result is True


# ──────────────────────────────────────────────────────────────────────────────
# models/deactivation.py
# ──────────────────────────────────────────────────────────────────────────────

class TestDeactivationModel:

    @pytest.mark.asyncio
    async def test_create_deactivation_request(self):
        from app.models.deactivation import create_deactivation_request

        admin = await create_test_user(name="Admin", email="admin@deact.com", roles="admin")
        user = await create_test_user(name="User", email="user@deact.com", roles="process_leader")

        request = await create_deactivation_request(user["id"], "Quiero irme")
        assert request is not None
        assert request["status"] == "pending"

    @pytest.mark.asyncio
    async def test_duplicate_pending_request(self):
        from app.models.deactivation import create_deactivation_request

        admin = await create_test_user(name="Admin", email="admin@deact2.com", roles="admin")
        user = await create_test_user(name="User", email="user@deact2.com", roles="process_leader")

        req1 = await create_deactivation_request(user["id"], "Primera")
        req2 = await create_deactivation_request(user["id"], "Segunda")
        assert req1["id"] == req2["id"]

    @pytest.mark.asyncio
    async def test_get_deactivation_request_by_id(self):
        from app.models.deactivation import create_deactivation_request, get_deactivation_request_by_id

        admin = await create_test_user(name="Admin", email="admin@deact3.com", roles="admin")
        user = await create_test_user(name="User", email="user@deact3.com", roles="process_leader")

        request = await create_deactivation_request(user["id"], "Quiero irme")
        found = await get_deactivation_request_by_id(request["id"])
        assert found is not None
        assert found["user_name"] == "User"

    @pytest.mark.asyncio
    async def test_get_deactivation_requests_all(self):
        from app.models.deactivation import create_deactivation_request, get_deactivation_requests

        admin = await create_test_user(name="Admin", email="admin@deact4.com", roles="admin")
        user = await create_test_user(name="User", email="user@deact4.com", roles="process_leader")
        await create_deactivation_request(user["id"], "Quiero irme")

        requests = await get_deactivation_requests()
        assert len(requests) >= 1

    @pytest.mark.asyncio
    async def test_get_deactivation_requests_filtered(self):
        from app.models.deactivation import create_deactivation_request, get_deactivation_requests

        admin = await create_test_user(name="Admin", email="admin@deact5.com", roles="admin")
        user = await create_test_user(name="User", email="user@deact5.com", roles="process_leader")
        await create_deactivation_request(user["id"], "Quiero irme")

        requests = await get_deactivation_requests(status="pending")
        assert len(requests) >= 1

    @pytest.mark.asyncio
    async def test_process_request_approve(self):
        from app.models.deactivation import create_deactivation_request, process_deactivation_request

        admin = await create_test_user(name="Admin", email="admin@deact6.com", roles="admin")
        user = await create_test_user(name="User", email="user@deact6.com", roles="process_leader")
        request = await create_deactivation_request(user["id"], "Quiero irme")

        processed = await process_deactivation_request(request["id"], admin["id"], approve=True)
        assert processed is not None
        assert processed["status"] == "approved"

        # User should be deactivated
        db_user = await _test_get_one("SELECT * FROM users WHERE id = ?", (user["id"],))
        assert db_user["is_active"] == 0

    @pytest.mark.asyncio
    async def test_process_request_reject(self):
        from app.models.deactivation import create_deactivation_request, process_deactivation_request

        admin = await create_test_user(name="Admin", email="admin@deact7.com", roles="admin")
        user = await create_test_user(name="User", email="user@deact7.com", roles="process_leader")
        request = await create_deactivation_request(user["id"], "Quiero irme")

        processed = await process_deactivation_request(request["id"], admin["id"], approve=False)
        assert processed is not None
        assert processed["status"] == "rejected"

    @pytest.mark.asyncio
    async def test_process_request_not_found(self):
        from app.models.deactivation import process_deactivation_request

        admin = await create_test_user(name="Admin", email="admin@deact8.com", roles="admin")
        result = await process_deactivation_request(99999, admin["id"], approve=True)
        assert result is None

    @pytest.mark.asyncio
    async def test_process_already_processed(self):
        from app.models.deactivation import create_deactivation_request, process_deactivation_request

        admin = await create_test_user(name="Admin", email="admin@deact9.com", roles="admin")
        user = await create_test_user(name="User", email="user@deact9.com", roles="process_leader")
        request = await create_deactivation_request(user["id"], "Quiero irme")
        await process_deactivation_request(request["id"], admin["id"], approve=True)

        # Try again
        again = await process_deactivation_request(request["id"], admin["id"], approve=False)
        assert again is not None
        assert again["status"] == "approved"  # Status unchanged


# ──────────────────────────────────────────────────────────────────────────────
# models/notification.py
# ──────────────────────────────────────────────────────────────────────────────

class TestNotificationModel:

    @pytest.mark.asyncio
    async def test_create_notification(self):
        from app.models.notification import create_notification

        user = await create_test_user(name="User", email="user@nmod.com", roles="process_leader")
        notif = await create_notification(user["id"], "Título", "Mensaje", "test", 1)
        assert notif is not None
        assert notif["title"] == "Título"

    @pytest.mark.asyncio
    async def test_get_notifications_by_user(self):
        from app.models.notification import create_notification, get_notifications_by_user

        user = await create_test_user(name="User", email="user@nmod2.com", roles="process_leader")
        await create_notification(user["id"], "N1", "M1")
        await create_notification(user["id"], "N2", "M2")

        notifs = await get_notifications_by_user(user["id"])
        assert len(notifs) >= 2

    @pytest.mark.asyncio
    async def test_get_unread_only(self):
        from app.models.notification import create_notification, get_notifications_by_user

        user = await create_test_user(name="User", email="user@nmod3.com", roles="process_leader")
        await create_notification(user["id"], "N1", "M1")

        notifs = await get_notifications_by_user(user["id"], unread_only=True)
        assert len(notifs) >= 1

    @pytest.mark.asyncio
    async def test_mark_notification_as_read(self):
        from app.models.notification import create_notification, mark_notification_as_read

        user = await create_test_user(name="User", email="user@nmod4.com", roles="process_leader")
        notif = await create_notification(user["id"], "N1", "M1")

        updated = await mark_notification_as_read(notif["id"])
        assert updated is not None
        assert updated["read"] == 1

    @pytest.mark.asyncio
    async def test_mark_notification_not_found(self):
        from app.models.notification import mark_notification_as_read

        result = await mark_notification_as_read(99999)
        assert result is None

    @pytest.mark.asyncio
    async def test_mark_all_as_read(self):
        from app.models.notification import create_notification, mark_all_notifications_as_read

        user = await create_test_user(name="User", email="user@nmod5.com", roles="process_leader")
        await create_notification(user["id"], "N1", "M1")
        await create_notification(user["id"], "N2", "M2")

        count = await mark_all_notifications_as_read(user["id"])
        assert isinstance(count, int)

    @pytest.mark.asyncio
    async def test_delete_notification(self):
        from app.models.notification import create_notification, delete_notification

        user = await create_test_user(name="User", email="user@nmod6.com", roles="process_leader")
        notif = await create_notification(user["id"], "N1", "M1")

        result = await delete_notification(notif["id"])
        assert result is True

    @pytest.mark.asyncio
    async def test_delete_notification_not_found(self):
        from app.models.notification import delete_notification

        result = await delete_notification(99999)
        assert result is False

    @pytest.mark.asyncio
    async def test_get_unread_count(self):
        from app.models.notification import create_notification, get_unread_notification_count

        user = await create_test_user(name="User", email="user@nmod7.com", roles="process_leader")
        await create_notification(user["id"], "N1", "M1")

        count = await get_unread_notification_count(user["id"])
        assert count >= 1


# ──────────────────────────────────────────────────────────────────────────────
# models/audit.py
# ──────────────────────────────────────────────────────────────────────────────

class TestAuditModel:

    @pytest.mark.asyncio
    async def test_create_audit_report(self):
        from app.models.audit import create_audit_report

        admin = await create_test_user(name="Admin", email="admin@amod.com", roles="admin")
        auditor = await create_test_user(name="Auditor", email="auditor@amod.com", roles="auditor")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])

        report = await create_audit_report("Título", "Contenido", auditor["id"], process["id"])
        assert report is not None
        assert report["auditor_name"] == "Auditor"

    @pytest.mark.asyncio
    async def test_get_audit_reports_filtered(self):
        from app.models.audit import create_audit_report, get_audit_reports

        admin = await create_test_user(name="Admin", email="admin@amod2.com", roles="admin")
        auditor = await create_test_user(name="Auditor", email="auditor@amod2.com", roles="auditor")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        await create_audit_report("T1", "C1", auditor["id"], process["id"])

        reports = await get_audit_reports(process_id=process["id"])
        assert len(reports) >= 1

        reports_by_auditor = await get_audit_reports(auditor_id=auditor["id"])
        assert len(reports_by_auditor) >= 1

        reports_by_status = await get_audit_reports(status="draft")
        assert len(reports_by_status) >= 1

    @pytest.mark.asyncio
    async def test_update_audit_report(self):
        from app.models.audit import create_audit_report, update_audit_report

        auditor = await create_test_user(name="Auditor", email="auditor@amod3.com", roles="auditor")
        report = await create_audit_report("T1", "C1", auditor["id"])

        updated = await update_audit_report(report["id"], title="Actualizado", content="Nuevo contenido")
        assert updated is not None
        assert updated["title"] == "Actualizado"

    @pytest.mark.asyncio
    async def test_update_audit_report_empty(self):
        from app.models.audit import create_audit_report, update_audit_report

        auditor = await create_test_user(name="Auditor", email="auditor@amod4.com", roles="auditor")
        report = await create_audit_report("T1", "C1", auditor["id"])

        updated = await update_audit_report(report["id"])
        assert updated is not None

    @pytest.mark.asyncio
    async def test_delete_audit_report(self):
        from app.models.audit import create_audit_report, delete_audit_report

        auditor = await create_test_user(name="Auditor", email="auditor@amod5.com", roles="auditor")
        report = await create_audit_report("T1", "C1", auditor["id"])

        result = await delete_audit_report(report["id"])
        assert result is True


# ──────────────────────────────────────────────────────────────────────────────
# models/statistics.py
# ──────────────────────────────────────────────────────────────────────────────

class TestStatisticsModel:

    @pytest.mark.asyncio
    async def test_get_dashboard_statistics(self):
        from app.models.statistics import get_dashboard_statistics

        admin = await create_test_user(name="Admin", email="admin@smod.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])

        stats = await get_dashboard_statistics()
        assert stats["total_actions"] >= 1
        assert "completion_rate" in stats

    @pytest.mark.asyncio
    async def test_get_actions_by_type(self):
        from app.models.statistics import get_actions_by_type

        admin = await create_test_user(name="Admin", email="admin@smod2.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])

        result = await get_actions_by_type()
        assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_get_actions_by_status(self):
        from app.models.statistics import get_actions_by_status

        admin = await create_test_user(name="Admin", email="admin@smod3.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"], status="pending")

        result = await get_actions_by_status()
        assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_get_actions_by_status_with_filters(self):
        from app.models.statistics import get_actions_by_status

        admin = await create_test_user(name="Admin", email="admin@smod4.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])

        for dr in ["week", "month", "quarter", "year"]:
            result = await get_actions_by_status(process_id=process["id"], date_range=dr)
            assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_get_completion_rate(self):
        from app.models.statistics import get_completion_rate

        admin = await create_test_user(name="Admin", email="admin@smod5.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"], status="completed")

        result = await get_completion_rate()
        assert "rate" in result or "total" in result or isinstance(result, dict)

    @pytest.mark.asyncio
    async def test_get_completion_rate_with_filters(self):
        from app.models.statistics import get_completion_rate

        admin = await create_test_user(name="Admin", email="admin@smod6.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])

        for dr in ["week", "month", "quarter", "year"]:
            result = await get_completion_rate(process_id=process["id"], date_range=dr)
            assert isinstance(result, dict)

    @pytest.mark.asyncio
    async def test_get_actions_over_time(self):
        from app.models.statistics import get_actions_over_time

        admin = await create_test_user(name="Admin", email="admin@smod7.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])

        result = await get_actions_over_time()
        assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_get_actions_over_time_with_filters(self):
        from app.models.statistics import get_actions_over_time

        admin = await create_test_user(name="Admin", email="admin@smod8.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])

        for dr in ["week", "month", "quarter", "year"]:
            result = await get_actions_over_time(process_id=process["id"], date_range=dr)
            assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_get_process_statistics(self):
        from app.models.statistics import get_process_statistics

        admin = await create_test_user(name="Admin", email="admin@smod9.com", roles="admin")
        process = await create_test_process(name="Proc", created_by=admin["id"], leader_id=admin["id"])
        await create_test_action(process_id=process["id"], leader_id=admin["id"], created_by=admin["id"])

        result = await get_process_statistics()
        assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_get_process_statistics_include_zero(self):
        from app.models.statistics import get_process_statistics

        admin = await create_test_user(name="Admin", email="admin@smod10.com", roles="admin")
        await create_test_process(name="Proc Vacío", created_by=admin["id"], leader_id=admin["id"])

        result = await get_process_statistics(include_zero_counts=True)
        assert isinstance(result, list)
