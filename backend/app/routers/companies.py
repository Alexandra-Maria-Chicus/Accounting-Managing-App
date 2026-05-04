from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.company import Company, CompanyCreate, CompanyUpdate, Observation, ObservationCreate
from app.services import company_service

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("", response_model=List[Company])
def list_companies(db: Session = Depends(get_db)):
    return company_service.get_all(db)


@router.get("/{company_id}", response_model=Company)
def get_company(company_id: int, db: Session = Depends(get_db)):
    company = company_service.get_by_id(db, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.post("", response_model=Company, status_code=201)
def create_company(data: CompanyCreate, db: Session = Depends(get_db)):
    try:
        return company_service.create(db, data)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.put("/{company_id}", response_model=Company)
def update_company(company_id: int, data: CompanyUpdate, db: Session = Depends(get_db)):
    try:
        company = company_service.update(db, company_id, data)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.delete("/{company_id}", status_code=204)
def delete_company(company_id: int, db: Session = Depends(get_db)):
    if not company_service.delete(db, company_id):
        raise HTTPException(status_code=404, detail="Company not found")


@router.post("/{company_id}/observations", response_model=Observation, status_code=201)
def add_observation(company_id: int, data: ObservationCreate, db: Session = Depends(get_db)):
    obs = company_service.add_observation(db, company_id, data)
    if obs is None:
        raise HTTPException(status_code=404, detail="Company not found")
    return obs


@router.patch("/{company_id}/observations/{obs_id}/toggle", response_model=Observation)
def toggle_observation(company_id: int, obs_id: int, db: Session = Depends(get_db)):
    obs = company_service.toggle_observation(db, company_id, obs_id)
    if obs is None:
        raise HTTPException(status_code=404, detail="Observation not found")
    return obs


@router.delete("/{company_id}/observations/{obs_id}", status_code=204)
def delete_observation(company_id: int, obs_id: int, db: Session = Depends(get_db)):
    if not company_service.delete_observation(db, company_id, obs_id):
        raise HTTPException(status_code=404, detail="Observation not found")