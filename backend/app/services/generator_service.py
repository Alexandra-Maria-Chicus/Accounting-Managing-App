import asyncio
import random
from datetime import date
from typing import Optional

from faker import Faker

from app.db.session import SessionLocal
from app.db.models import Record, Company
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

        db = SessionLocal()
        try:
            firm_names = [c.name for c in db.query(Company).all()] or ["Sample Corp"]
            batch = []
            for _ in range(5):
                record = Record(
                    firm=random.choice(firm_names),
                    employee=random.choice(_EMPLOYEES),
                    status=random.choice(_STATUSES),
                    period_month=random.randint(0, 11),
                    period_year=random.choice([2025, 2026]),
                    date_brought=date.today().isoformat(),
                )
                db.add(record)
            db.commit()

            # fetch the batch to broadcast
            records = db.query(Record).order_by(Record.id.desc()).limit(5).all()
            batch = [
                {
                    "id": r.id,
                    "firm": r.firm,
                    "employee": r.employee,
                    "status": r.status,
                    "periodMonth": r.period_month,
                    "periodYear": r.period_year,
                    "dateBrought": r.date_brought,
                }
                for r in records
            ]
        finally:
            db.close()

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