"""
seed_full.py — idempotent seed for the multi-tenant schema.

Creates:
  - Roles + permissions
  - Organization "Complet Cont" (staff_code STAFF-2026)
  - Admin user  maria.alex1106@gmail.com / admin123
  - 2 employee users
  - 10 companies (all scoped to the org, each with a registration_code + contact person)
  - 2 client users linked to companies
  - 12 records spread across months (all scoped to the org)

Safe to re-run: checks before inserting, updates password/org on existing admin.
"""

import os
import sys
from pathlib import Path

# Allow running from the backend/ directory directly.
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

from app.db.session import SessionLocal
from app.db.models import (
    Organization, Company, ContactPerson, Record,
    Role, Permission, RolePermission, User,
)
from app.services.auth_service import hash_password


# ── 1. Roles + permissions ────────────────────────────────────────────────────

def seed_roles(db):
    existing_roles = {r.name: r for r in db.query(Role).all()}
    for name in ("admin", "employee", "client"):
        if name not in existing_roles:
            existing_roles[name] = Role(name=name)
            db.add(existing_roles[name])
    db.flush()

    all_perms = [
        "read_records", "write_records", "delete_records",
        "manage_companies", "view_own_company",
    ]
    existing_perms = {p.name: p for p in db.query(Permission).all()}
    for name in all_perms:
        if name not in existing_perms:
            existing_perms[name] = Permission(name=name)
            db.add(existing_perms[name])
    db.flush()

    # Map role → permissions it should have
    role_perm_map = {
        "admin":    ["read_records", "write_records", "delete_records", "manage_companies"],
        "employee": ["read_records", "write_records"],
        "client":   ["view_own_company"],
    }
    existing_links = {
        (rp.role_id, rp.permission_id)
        for rp in db.query(RolePermission).all()
    }
    for role_name, perm_names in role_perm_map.items():
        role = existing_roles[role_name]
        for pname in perm_names:
            perm = existing_perms[pname]
            if (role.id, perm.id) not in existing_links:
                db.add(RolePermission(role_id=role.id, permission_id=perm.id))
    db.commit()
    print("Roles + permissions: OK")
    return {r.name: r for r in db.query(Role).all()}


# ── 2. Organization ───────────────────────────────────────────────────────────

def seed_org(db):
    org = db.query(Organization).filter_by(staff_code="STAFF-2026").first()
    if not org:
        org = Organization(name="Complet Cont", staff_code="STAFF-2026")
        db.add(org)
        db.commit()
        db.refresh(org)
        print(f"Organization created (id={org.id})")
    else:
        print(f"Organization already exists (id={org.id})")
    return org


# ── 3–4. Users ────────────────────────────────────────────────────────────────

def seed_users(db, org, role_map, company_map):
    users_data = [
        # (email, password, name, role, company_name_or_None)
        ("maria.alex1106@gmail.com", "admin123",    "Maria Alex",        "admin",    None),
        ("sarah@completcont.ro",     "employee123", "Sarah Johnson",     "employee", None),
        ("michael@completcont.ro",   "employee123", "Michael Chen",      "employee", None),
        ("finance@valleyedu.org",    "client123",   "Dr. Sarah Mitchell","client",   "Valley Education"),
        ("j.doe@acme.com",           "client123",   "John Doe",          "client",   "Acme Corporation"),
    ]
    for email, password, name, role_name, company_name in users_data:
        company_id = company_map.get(company_name) if company_name else None
        existing = db.query(User).filter_by(email=email).first()
        if existing:
            existing.password_hash   = hash_password(password)
            existing.organization_id = org.id
            existing.role_id         = role_map[role_name].id
            if company_id:
                existing.company_id = company_id
            print(f"  User updated: {email}")
        else:
            db.add(User(
                email=email,
                password_hash=hash_password(password),
                name=name,
                role_id=role_map[role_name].id,
                company_id=company_id,
                organization_id=org.id,
            ))
            print(f"  User created: {email}")
    db.commit()


# ── 5. Companies ──────────────────────────────────────────────────────────────

def seed_companies(db, org):
    companies_data = [
        {"name": "Valley Education",       "phone": "+40 758 177 097", "email": "finance@valleyedu.org",   "address": "Str. Visinului, Bacau",               "code": "VALLEY-2026",    "contact": {"name": "Dr. Sarah Mitchell", "email": "sarah.mitchell@valleyedu.org"}},
        {"name": "Acme Corporation",       "phone": "+40 722 100 200", "email": "info@acme.com",            "address": "Bulevardul Eroilor, Cluj-Napoca",      "code": "ACME-2026",      "contact": {"name": "John Doe",           "email": "j.doe@acme.com"}},
        {"name": "TechStart Inc.",         "phone": "+40 744 333 444", "email": "contact@techstart.io",    "address": "Str. Memorandumului, Cluj-Napoca",     "code": "TECHSTART-2026", "contact": {"name": "Alice Vance",        "email": "alice@techstart.io"}},
        {"name": "Global Logistics",       "phone": "+40 733 555 666", "email": "logistics@global.ro",     "address": "Calea Turzii, Cluj-Napoca",            "code": "GLOBAL-2026",    "contact": {"name": "Mark Stevens",       "email": "m.stevens@global.ro"}},
        {"name": "Riverside Medical",      "phone": "+40 788 111 222", "email": "office@riverside.med",    "address": "Str. Clinicilor, Cluj-Napoca",         "code": "RIVERSIDE-2026", "contact": {"name": "Elena Popescu",      "email": "e.popescu@riverside.med"}},
        {"name": "Downtown Retail",        "phone": "+40 755 999 000", "email": "sales@downtown.ro",       "address": "Str. Regele Ferdinand, Cluj-Napoca",   "code": "DOWNTOWN-2026",  "contact": {"name": "George Marin",       "email": "g.marin@downtown.ro"}},
        {"name": "Mountain Coffee",        "phone": "+40 741 222 333", "email": "hello@mtncoffee.com",     "address": "Str. Avram Iancu, Brasov",             "code": "MOUNTAIN-2026",  "contact": {"name": "Ana Maria",          "email": "ana@mtncoffee.com"}},
        {"name": "Precision Tech",         "phone": "+40 725 666 777", "email": "eng@prectech.ro",         "address": "Zona Industriala, Sibiu",              "code": "PRECISION-2026", "contact": {"name": "Victor Ionescu",     "email": "v.ionescu@prectech.ro"}},
        {"name": "Blue Wave Agency",       "phone": "+40 732 444 555", "email": "ads@bluewave.ro",         "address": "Str. Constanta, Mamaia",               "code": "BLUEWAVE-2026",  "contact": {"name": "Laura Dumitru",      "email": "laura@bluewave.ro"}},
        {"name": "Green Energy Solutions", "phone": "+40 766 888 999", "email": "solar@greenenergy.ro",    "address": "Soseaua Pipera, Bucuresti",            "code": "GREEN-2026",     "contact": {"name": "Radu Filipescu",     "email": "r.filipescu@greenenergy.ro"}},
    ]
    company_map = {}
    for c in companies_data:
        existing = db.query(Company).filter_by(
            name=c["name"], organization_id=org.id
        ).first()
        if existing:
            existing.registration_code = c["code"]
            company_map[c["name"]] = existing.id
            print(f"  Company already exists: {c['name']}")
        else:
            company = Company(
                name=c["name"],
                phone=c["phone"],
                email=c["email"],
                address=c["address"],
                registration_code=c["code"],
                organization_id=org.id,
            )
            db.add(company)
            db.flush()
            db.add(ContactPerson(
                company_id=company.id,
                name=c["contact"]["name"],
                email=c["contact"]["email"],
            ))
            company_map[c["name"]] = company.id
            print(f"  Company created: {c['name']}")
    db.commit()
    return company_map


# ── 7. Records ────────────────────────────────────────────────────────────────

def seed_records(db, org, company_map):
    if db.query(Record).filter_by(organization_id=org.id).count() > 0:
        print("Records already exist for this org, skipping.")
        return

    records_data = [
        {"firm": "Acme Corporation",       "status": "Finished",    "periodMonth": 4, "periodYear": 2026, "dateBrought": "2026-05-05", "employee": "Sarah Johnson"},
        {"firm": "TechStart Inc.",         "status": "In Progress", "periodMonth": 4, "periodYear": 2026, "dateBrought": "2026-05-08", "employee": "Michael Chen"},
        {"firm": "Global Logistics",       "status": "Not Started", "periodMonth": 4, "periodYear": 2026, "dateBrought": "2026-05-28", "employee": "Maria Alex"},
        {"firm": "Riverside Medical",      "status": "In Progress", "periodMonth": 4, "periodYear": 2026, "dateBrought": "2026-05-02", "employee": "Sarah Johnson"},
        {"firm": "Downtown Retail",        "status": "Finished",    "periodMonth": 3, "periodYear": 2026, "dateBrought": "2026-04-10", "employee": "Michael Chen"},
        {"firm": "Mountain Coffee",        "status": "Not Started", "periodMonth": 3, "periodYear": 2026, "dateBrought": "2026-04-15", "employee": "Maria Alex"},
        {"firm": "Precision Tech",         "status": "Finished",    "periodMonth": 3, "periodYear": 2026, "dateBrought": "2026-04-03", "employee": "Sarah Johnson"},
        {"firm": "Blue Wave Agency",       "status": "In Progress", "periodMonth": 3, "periodYear": 2026, "dateBrought": "2026-04-18", "employee": "Michael Chen"},
        {"firm": "Valley Education",       "status": "Finished",    "periodMonth": 2, "periodYear": 2026, "dateBrought": "2026-03-12", "employee": "Maria Alex"},
        {"firm": "Acme Corporation",       "status": "Finished",    "periodMonth": 2, "periodYear": 2026, "dateBrought": "2026-03-08", "employee": "Sarah Johnson"},
        {"firm": "TechStart Inc.",         "status": "In Progress", "periodMonth": 2, "periodYear": 2026, "dateBrought": "2026-03-20", "employee": "Michael Chen"},
        {"firm": "Global Logistics",       "status": "Not Started", "periodMonth": 2, "periodYear": 2026, "dateBrought": "2026-03-25", "employee": "Maria Alex"},
    ]
    for r in records_data:
        db.add(Record(
            firm=r["firm"],
            company_id=company_map.get(r["firm"]),
            organization_id=org.id,
            employee=r["employee"],
            status=r["status"],
            periodMonth=r["periodMonth"],
            periodYear=r["periodYear"],
            dateBrought=r["dateBrought"],
        ))
    db.commit()
    print(f"Records seeded: {len(records_data)} rows")


# ── Entry point ───────────────────────────────────────────────────────────────

def run():
    db = SessionLocal()
    try:
        print("\n── Roles + permissions ──────────────────────────────")
        role_map = seed_roles(db)

        print("\n── Organization ─────────────────────────────────────")
        org = seed_org(db)

        print("\n── Companies ────────────────────────────────────────")
        company_map = seed_companies(db, org)

        print("\n── Users ────────────────────────────────────────────")
        seed_users(db, org, role_map, company_map)

        print("\n── Records ──────────────────────────────────────────")
        seed_records(db, org, company_map)

        print("\n" + "=" * 50)
        print("ADMIN LOGIN CREATED:")
        print("  Email:    maria.alex1106@gmail.com")
        print("  Password: admin123")
        print("  Staff code (for employee signup): STAFF-2026")
        print("=" * 50)
    finally:
        db.close()


if __name__ == "__main__":
    run()
