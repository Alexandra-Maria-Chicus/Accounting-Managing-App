import os
from pathlib import Path
from dotenv import load_dotenv
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, configure_mappers

load_dotenv(Path(__file__).parent.parent / ".env")

from app.db.base import Base
from app.db.models import Company, ContactPerson, Record
from app.db.session import get_db
from app.main import app

configure_mappers() 

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_db(db):
    company = Company(name="Valley Education", phone="+40 758 177 097", email="finance@valleyedu.org", address="Str. Visinului, Bacau")
    company2 = Company(name="Acme Corporation", phone="+40 722 100 200", email="info@acme.com", address="Bulevardul Eroilor, Cluj-Napoca")
    db.add(company)
    db.add(company2)
    db.flush()
    db.add(ContactPerson(company_id=company.id, name="Dr. Sarah Mitchell", email="sarah.mitchell@valleyedu.org"))
    db.add(ContactPerson(company_id=company2.id, name="John Doe", email="j.doe@acme.com"))
    db.add(Record(firm="Valley Education", company_id=company.id, employee="Maria Chicus", status="Finished", periodMonth=2, periodYear=2026, dateBrought="2026-04-05"))
    db.add(Record(firm="Acme Corporation", company_id=company2.id, employee="Sarah Johnson", status="In Progress", periodMonth=2, periodYear=2026, dateBrought="2026-04-08"))
    db.add(Record(firm="Valley Education", company_id=company.id, employee="Michael Chen", status="Not Started", periodMonth=2, periodYear=2026, dateBrought="2026-04-10"))
    db.commit()

@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_db(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()