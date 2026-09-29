import pytest
from app.models.deactivation import (
    create_deactivation_request,
    get_deactivation_request_by_id,
    get_deactivation_requests,
    process_deactivation_request
)
from app.models.assignment import (
    assign_leader_to_process,
    get_process_leaders,
    remove_leader_from_process,
    transfer_process_leadership,
    get_leader_processes
)
from app.schemas.assignment import AssignmentCreate
from app.models.action import (
    get_actions_by_process,
    get_actions_by_leader,
    get_action_statistics
)
from app.models.statistics import (
    get_dashboard_statistics,
    get_actions_by_type,
    get_actions_by_status,
    get_completion_rate,
    get_actions_over_time,
    get_process_statistics
)

@pytest.mark.asyncio
async def test_deactivation_model_flow(admin_user, leader_user):
    # 1. Create deactivation request
    req = await create_deactivation_request(leader_user["id"], "Cambio de departamento")
    assert req is not None
    assert req["status"] == "pending"

    # 2. Get by ID & list
    req_id = req["id"]
    req_by_id = await get_deactivation_request_by_id(req_id)
    assert req_by_id["id"] == req_id

    all_reqs = await get_deactivation_requests()
    assert len(all_reqs) >= 1

    # 3. Process request (approve)
    approved = await process_deactivation_request(req_id, admin_user["id"], approve=True)
    assert approved["status"] == "approved"

@pytest.mark.asyncio
async def test_assignments_model_flow(admin_user, leader_user, test_process):
    proc_id = test_process["id"]
    leader_id = leader_user["id"]

    # 1. Assign leader to process
    assigned = await assign_leader_to_process(
        AssignmentCreate(process_id=proc_id, leader_id=leader_id),
        admin_id=admin_user["id"]
    )
    assert assigned is not None

    # 2. Get process leaders & leader processes
    leaders = await get_process_leaders(proc_id)
    assert any(l["id"] == leader_id for l in leaders)

    procs = await get_leader_processes(leader_id)
    assert any(p["id"] == proc_id for p in procs)

    # 3. Transfer leadership to admin
    transferred = await transfer_process_leadership(proc_id, leader_id, admin_user["id"])
    assert transferred is True

    # 4. Remove leader
    removed = await remove_leader_from_process(proc_id, admin_user["id"])
    assert removed is True

@pytest.mark.asyncio
async def test_statistics_and_actions_model_flow(test_process, leader_user, admin_user):
    proc_id = test_process["id"]

    dash = await get_dashboard_statistics()
    assert isinstance(dash, dict)

    by_type = await get_actions_by_type()
    assert isinstance(by_type, list)

    by_status = await get_actions_by_status()
    assert isinstance(by_status, list)

    rate = await get_completion_rate()
    assert isinstance(rate, dict)

    over_time = await get_actions_over_time()
    assert isinstance(over_time, list)

    proc_stats = await get_process_statistics()
    assert isinstance(proc_stats, list)

    stats = await get_action_statistics(process_id=proc_id)
    assert isinstance(stats, dict)
