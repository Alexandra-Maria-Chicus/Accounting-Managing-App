import random
import sys
import os
from datetime import date
sys.path.insert(0, os.path.dirname(__file__))

from faker import Faker
from app.db.session import SessionLocal
from app.db.models import Company, ContactPerson, Record

fake = Faker()

STATUSES   = ["Not Started", "In Progress", "Finished"]
EMPLOYEES  = ["Sarah Johnson", "Michael Chen", "Maria Chicus"]
NUM_COMPANIES = 100
NUM_RECORDS   = 5000


def seed_large(db):
    existing = db.query(Company).count()
    if existing >= NUM_COMPANIES:
        print(f"Already have {existing} companies. Skipping company seed.")
    else:
        print(f"Seeding {NUM_COMPANIES} companies...")
        for i in range(NUM_COMPANIES):
            name = f"{fake.company()} {i}"
            code = f"FIRM{i:04d}-2026"
            company = Company(
                name=name,
                phone=fake.phone_number()[:20],
                email=fake.company_email(),
                address=fake.address().replace('\n', ', ')[:100],
                registration_code=code,
            )
            db.add(company)
            db.flush()
            db.add(ContactPerson(
                company_id=company.id,
                name=fake.name(),
                email=fake.email(),
            ))
            if i % 20 == 0:
                print(f"  {i}/{NUM_COMPANIES} companies...")
                db.commit()
        db.commit()
        print("Companies done.")

    existing_records = db.query(Record).count()
    if existing_records >= NUM_RECORDS:
        print(f"Already have {existing_records} records. Skipping record seed.")
        return

    print(f"Seeding {NUM_RECORDS} records...")
    company_ids = [c.id for c in db.query(Company.id).all()]
    company_names = {c.id: c.name for c in db.query(Company).all()}

    for i in range(NUM_RECORDS):
        cid = random.choice(company_ids)
        month = random.randint(0, 11)
        year  = random.choice([2024, 2025, 2026])
        record = Record(
            firm=company_names[cid],
            company_id=cid,
            employee=random.choice(EMPLOYEES),
            status=random.choice(STATUSES),
            periodMonth=month,
            periodYear=year,
            dateBrought=fake.date_between(
                start_date=date(year, 1, 1),
                end_date=date(year, 12, 31),
            ).isoformat(),
        )
        db.add(record)
        if i % 500 == 0:
            print(f"  {i}/{NUM_RECORDS} records...")
            db.commit()

    db.commit()
    print(f"Done. Total records: {db.query(Record).count()}")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_large(db)
    finally:
        db.close()
