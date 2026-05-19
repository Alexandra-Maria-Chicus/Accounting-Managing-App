import time
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.models import Record

_cache: dict = {}
CACHE_TTL_SECONDS = 60


def get_stats_naive(db: Session) -> dict:
    """
    Naive implementation — loads ALL records into Python memory and aggregates
    at the application layer. Intentionally slow for JMeter demo.
    """
    start = time.perf_counter()

    all_records = db.query(Record).all()

    result = {}
    for r in all_records:
        key = r.firm or "Unknown"
        if key not in result:
            result[key] = {
                "firm": key,
                "total": 0,
                "finished": 0,
                "in_progress": 0,
                "not_started": 0,
                "by_employee": {},
            }
        result[key]["total"] += 1
        if r.status == "Finished":
            result[key]["finished"] += 1
        elif r.status == "In Progress":
            result[key]["in_progress"] += 1
        else:
            result[key]["not_started"] += 1

        emp = r.employee or "Unknown"
        result[key]["by_employee"][emp] = result[key]["by_employee"].get(emp, 0) + 1

    elapsed = time.perf_counter() - start
    return {
        "query_time_ms": round(elapsed * 1000, 2),
        "total_records": len(all_records),
        "cached": False,
        "companies": sorted(result.values(), key=lambda x: x["total"], reverse=True)[:50],
    }


def get_stats_cached(db: Session) -> dict:
    """
    Optimized implementation — SQL GROUP BY (uses DB indexes) +
    60-second in-memory cache so repeated hits return instantly.
    """
    global _cache
    now = time.perf_counter()

    if _cache and (now - _cache.get("timestamp", 0)) < CACHE_TTL_SECONDS:
        cached_data = _cache["data"].copy()
        cached_data["cached"] = True
        cached_data["query_time_ms"] = 0.0
        return cached_data

    start = time.perf_counter()

    rows = (
        db.query(
            Record.firm,
            Record.status,
            Record.employee,
            func.count(Record.id).label("cnt"),
        )
        .group_by(Record.firm, Record.status, Record.employee)
        .all()
    )

    result = {}
    total_records = 0
    for firm, status, employee, cnt in rows:
        key = firm or "Unknown"
        total_records += cnt
        if key not in result:
            result[key] = {
                "firm": key,
                "total": 0,
                "finished": 0,
                "in_progress": 0,
                "not_started": 0,
                "by_employee": {},
            }
        result[key]["total"] += cnt
        if status == "Finished":
            result[key]["finished"] += cnt
        elif status == "In Progress":
            result[key]["in_progress"] += cnt
        else:
            result[key]["not_started"] += cnt

        emp = employee or "Unknown"
        result[key]["by_employee"][emp] = result[key]["by_employee"].get(emp, 0) + cnt

    elapsed = time.perf_counter() - start
    data = {
        "query_time_ms": round(elapsed * 1000, 2),
        "total_records": total_records,
        "cached": False,
        "companies": sorted(result.values(), key=lambda x: x["total"], reverse=True)[:50],
    }

    _cache = {"data": data, "timestamp": now}
    return data
