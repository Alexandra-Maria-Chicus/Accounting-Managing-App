import asyncio
import random
from datetime import date
from typing import Optional

from faker import Faker

from app import store
from app.ws.manager import ws_manager

fake = Faker()

_STATUSES = ["Not Started", "In Progress", "Finished"]
_EMPLOYEES = ["Sarah Johnson", "Michael Chen", "Maria Chicus"]

_task: Optional[asyncio.Task] = None
_running = False


def is_running() -> bool:
    return _running


async def _loop() -> None:
    global _running
    while _running:
        await asyncio.sleep(5)
        if not _running:
            break

        firm_names = [c["name"] for c in store.companies] or ["Sample Corp"]
        batch = []
        for _ in range(5):
            record = {
                "id": store.next_id("records"),
                "firm": random.choice(firm_names),
                "employee": random.choice(_EMPLOYEES),
                "status": random.choice(_STATUSES),
                "periodMonth": random.randint(0, 11),
                "periodYear": random.choice([2025, 2026]),
                "dateBrought": date.today().isoformat(),
            }
            store.records.insert(0, record)
            batch.append(record)

        await ws_manager.broadcast({"type": "new_records", "data": batch})


async def start() -> None:
    global _task, _running
    if _running:
        return
    _running = True
    _task = asyncio.create_task(_loop())


async def stop() -> None:
    global _task, _running
    _running = False
    if _task:
        _task.cancel()
        try:
            await _task
        except asyncio.CancelledError:
            pass
        _task = None
