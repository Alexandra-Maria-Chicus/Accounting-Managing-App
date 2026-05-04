from typing import Any, Dict, List, Optional
from collections import Counter
from sqlalchemy.orm import Session

from app.db.models import Record

def get_all(db, page, page_size, month=None, year=None):
    query = db.query(Record)
    if month is not None:
        query = query.filter(Record.periodMonth == month)
    if year is not None:
        query = query.filter(Record.periodYear == year)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, -(-total // page_size)),
    }

def get_by_id(db: Session, record_id: int) -> Optional[Record]:
    return db.query(Record).filter(Record.id == record_id).first()

def create(db: Session, data) -> Record:
    record = Record(
        firm=data.firm,
        employee=data.employee,
        status=data.status,
        periodMonth=data.periodMonth,
        periodYear=data.periodYear,
        dateBrought=data.dateBrought,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def update(db: Session, record_id: int, data) -> Optional[Record]:
    record = get_by_id(db, record_id)
    if not record:
        return None
    record.firm = data.firm
    record.employee = data.employee
    record.status = data.status
    record.period_month = data.periodMonth
    record.period_year = data.periodYear
    record.date_brought = data.dateBrought
    db.commit()
    db.refresh(record)
    return record

def delete(db: Session, record_id: int) -> bool:
    record = get_by_id(db, record_id)
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True

def get_stats(db):
    records = db.query(Record).all()
    return {
        "total": len(records),
        "by_status": dict(Counter(r.status for r in records)),
        "by_employee": dict(Counter(r.employee for r in records)),
        "by_month": dict(Counter(f"{r.periodYear}-{r.periodMonth:02d}" for r in records)),
    }