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
from app.db.models.role import Role
from app.db.models.user import User
from app.db.session import get_db
from app.services import auth_service
from app.main import app

configure_mappers()

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

FAKE_ADMIN = {
    "id": 1,
    "email": "admin@test.com",
    "role": "admin",
    "name": "Test Admin",
    "company": None,
    "permissions": ["read_records", "write_records", "delete_records", "manage_companies"],
}


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_db(db):
    # Roles
    admin_role = Role(name="admin")
    emp_role = Role(name="employee")
    client_role = Role(name="client")
    db.add_all([admin_role, emp_role, client_role])
    db.flush()

    # Companies (with registration codes for client-registration tests)
    company = Company(
        name="Valley Education",
        phone="+40 758 177 097",
        email="finance@valleyedu.org",
        address="Str. Visinului, Bacau",
        registration_code="VALLEY-2026",
    )
    company2 = Company(
        name="Acme Corporation",
        phone="+40 722 100 200",
        email="info@acme.com",
        address="Bulevardul Eroilor, Cluj-Napoca",
        registration_code="ACME-2026",
    )
    db.add_all([company, company2])
    db.flush()

    db.add(ContactPerson(company_id=company.id, name="Dr. Sarah Mitchell", email="sarah.mitchell@valleyedu.org"))
    db.add(ContactPerson(company_id=company2.id, name="John Doe", email="j.doe@acme.com"))

    # Seeded admin user (used by auth tests that call /auth/login directly)
    admin_user = User(
        email="admin@test.com",
        password_hash=auth_service.hash_password("admin123"),
        name="Test Admin",
        role_id=admin_role.id,
    )
    db.add(admin_user)

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
    """Pre-authenticated as admin — used by record/company/observation tests."""
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[auth_service.get_current_user] = lambda: FAKE_ADMIN
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def raw_client():
    """No auth override — used by auth tests to exercise real login/register/me."""
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
