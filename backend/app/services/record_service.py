from collections import Counter
from typing import Any, Dict, List, Optional

from app import store
from app.models.record import RecordCreate, RecordUpdate


def get_all(
    page: int,
    page_size: int,
    month: Optional[int] = None,
    year: Optional[int] = None,
) -> Dict[str, Any]:
    filtered: List[Dict] = store.records
    if month is not None:
        filtered = [r for r in filtered if r["periodMonth"] == month]
    if year is not None:
        filtered = [r for r in filtered if r["periodYear"] == year]
    total = len(filtered)
    start = (page - 1) * page_size
    return {
        "items": filtered[start : start + page_size],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, -(-total // page_size)),
    }


def get_by_id(record_id: int) -> Optional[Dict]:
    return next((r for r in store.records if r["id"] == record_id), None)


def create(data: RecordCreate) -> Dict:
    new_record = {"id": store.next_id("records"), **data.model_dump()}
    store.records.insert(0, new_record)
    return new_record


def update(record_id: int, data: RecordUpdate) -> Optional[Dict]:
    for i, r in enumerate(store.records):
        if r["id"] == record_id:
            store.records[i] = {"id": record_id, **data.model_dump()}
            return store.records[i]
    return None


def delete(record_id: int) -> bool:
    for i, r in enumerate(store.records):
        if r["id"] == record_id:
            store.records.pop(i)
            return True
    return False


def get_stats() -> Dict[str, Any]:
    return {
        "total": len(store.records),
        "by_status": dict(Counter(r["status"] for r in store.records)),
        "by_employee": dict(Counter(r["employee"] for r in store.records)),
        "by_month": dict(
            Counter(
                f"{r['periodYear']}-{r['periodMonth']:02d}" for r in store.records
            )
        ),
    }
