from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.record import Record, RecordCreate, RecordUpdate
from app.services import record_service

router = APIRouter(prefix="/records", tags=["records"])


@router.get("")
def list_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(5, ge=1, le=100),
    month: Optional[int] = Query(None, ge=0, le=11),
    year: Optional[int] = Query(None, ge=2000, le=2100),
    db: Session = Depends(get_db),
):
    return record_service.get_all(db, page, page_size, month, year)


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    return record_service.get_stats(db)


@router.get("/{record_id}", response_model=Record)
def get_record(record_id: int, db: Session = Depends(get_db)):
    record = record_service.get_by_id(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record


@router.post("", response_model=Record, status_code=201)
def create_record(data: RecordCreate, db: Session = Depends(get_db)):
    return record_service.create(db, data)


@router.put("/{record_id}", response_model=Record)
def update_record(record_id: int, data: RecordUpdate, db: Session = Depends(get_db)):
    record = record_service.update(db, record_id, data)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record


@router.delete("/{record_id}", status_code=204)
def delete_record(record_id: int, db: Session = Depends(get_db)):
    if not record_service.delete(db, record_id):
        raise HTTPException(status_code=404, detail="Record not found")