from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.db.models import Company, ContactPerson, Observation
from app.models.company import CompanyCreate, CompanyUpdate, ObservationCreate


def get_all(db: Session, organization_id: int = None) -> List[Company]:
    q = db.query(Company)
    if organization_id is not None:
        q = q.filter(Company.organization_id == organization_id)
    return q.all()


def get_by_id(db: Session, company_id: int) -> Optional[Company]:
    return db.query(Company).filter(Company.id == company_id).first()


def get_by_registration_code(db: Session, code: str) -> Optional[Company]:
    return db.query(Company).filter(
        Company.registration_code == code.strip().upper()
    ).first()


def create(db: Session, data: CompanyCreate, organization_id: int = None) -> Company:
    existing = db.query(Company).filter(
        Company.name.ilike(data.name),
        Company.organization_id == organization_id,
    ).first()
    if existing:
        raise ValueError(f"Company with name '{data.name}' already exists in your organisation")
    reg_code = data.registration_code.strip().upper() if data.registration_code and data.registration_code.strip() else None
    if reg_code:
        if get_by_registration_code(db, reg_code):
            raise ValueError(f"Registration code '{reg_code}' is already in use")
    company = Company(
        name=data.name,
        phone=data.phone,
        email=data.email,
        address=data.address,
        organization_id=organization_id,
        registration_code=reg_code,
    )
    db.add(company)
    db.flush()
    contact = ContactPerson(
        company_id=company.id,
        name=data.contactPerson.name,
        email=data.contactPerson.email,
    )
    db.add(contact)
    db.commit()
    db.refresh(company)
    return company


def update(db: Session, company_id: int, data: CompanyUpdate) -> Optional[Company]:
    company = get_by_id(db, company_id)
    if not company:
        return None
    duplicate = db.query(Company).filter(
        Company.name.ilike(data.name),
        Company.id != company_id
    ).first()
    if duplicate:
        raise ValueError(f"Company with name '{data.name}' already exists")
    company.name = data.name
    company.phone = data.phone
    company.email = data.email
    company.address = data.address
    company.contactPerson.name = data.contactPerson.name
    company.contactPerson.email = data.contactPerson.email
    if data.registration_code is not None:
        reg_code = data.registration_code.strip().upper() if data.registration_code.strip() else None
        if reg_code:
            existing = get_by_registration_code(db, reg_code)
            if existing and existing.id != company_id:
                raise ValueError(f"Registration code '{reg_code}' is already in use")
        company.registration_code = reg_code
    db.commit()
    db.refresh(company)
    return company


def delete(db: Session, company_id: int) -> bool:
    company = get_by_id(db, company_id)
    if not company:
        return False
    db.delete(company)
    db.commit()
    return True


def add_observation(db: Session, company_id: int, data: ObservationCreate) -> Optional[Observation]:
    company = get_by_id(db, company_id)
    if not company:
        return None
    obs = Observation(
        company_id=company_id,
        text=data.text,
        author=data.author,
        checked=False,
        createdAt=datetime.now(timezone.utc),
    )
    db.add(obs)
    db.commit()
    db.refresh(obs)
    return obs


def toggle_observation(db: Session, company_id: int, obs_id: int) -> Optional[Observation]:
    obs = db.query(Observation).filter(
        Observation.id == obs_id,
        Observation.company_id == company_id
    ).first()
    if not obs:
        return None
    obs.checked = not obs.checked
    db.commit()
    db.refresh(obs)
    return obs


def delete_observation(db: Session, company_id: int, obs_id: int) -> bool:
    obs = db.query(Observation).filter(
        Observation.id == obs_id,
        Observation.company_id == company_id
    ).first()
    if not obs:
        return False
    db.delete(obs)
    db.commit()
    return True