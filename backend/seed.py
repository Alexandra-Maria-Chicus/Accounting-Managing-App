from app.db.session import SessionLocal
from app.db.models import Company, ContactPerson, Record

def seed():
    db = SessionLocal()
    try:
        if db.query(Company).count() > 0:
            print("Already seeded, skipping.")
            return

        companies_data = [
            {"name": "Valley Education", "phone": "+40 758 177 097", "email": "finance@valleyedu.org", "address": "Str. Visinului, Bacau", "contact": {"name": "Dr. Sarah Mitchell", "email": "sarah.mitchell@valleyedu.org"}},
            {"name": "Acme Corporation", "phone": "+40 722 100 200", "email": "info@acme.com", "address": "Bulevardul Eroilor, Cluj-Napoca", "contact": {"name": "John Doe", "email": "j.doe@acme.com"}},
            {"name": "TechStart Inc.", "phone": "+40 744 333 444", "email": "contact@techstart.io", "address": "Str. Memorandumului, Cluj-Napoca", "contact": {"name": "Alice Vance", "email": "alice@techstart.io"}},
            {"name": "Global Logistics", "phone": "+40 733 555 666", "email": "logistics@global.ro", "address": "Calea Turzii, Cluj-Napoca", "contact": {"name": "Mark Stevens", "email": "m.stevens@global.ro"}},
            {"name": "Riverside Medical", "phone": "+40 788 111 222", "email": "office@riverside.med", "address": "Str. Clinicilor, Cluj-Napoca", "contact": {"name": "Elena Popescu", "email": "e.popescu@riverside.med"}},
            {"name": "Downtown Retail", "phone": "+40 755 999 000", "email": "sales@downtown.ro", "address": "Str. Regele Ferdinand, Cluj-Napoca", "contact": {"name": "George Marin", "email": "g.marin@downtown.ro"}},
            {"name": "Mountain Coffee", "phone": "+40 741 222 333", "email": "hello@mtncoffee.com", "address": "Str. Avram Iancu, Brasov", "contact": {"name": "Ana Maria", "email": "ana@mtncoffee.com"}},
            {"name": "Precision Tech", "phone": "+40 725 666 777", "email": "eng@prectech.ro", "address": "Zona Industriala, Sibiu", "contact": {"name": "Victor Ionescu", "email": "v.ionescu@prectech.ro"}},
            {"name": "Blue Wave Agency", "phone": "+40 732 444 555", "email": "ads@bluewave.ro", "address": "Str. Constanta, Mamaia", "contact": {"name": "Laura Dumitru", "email": "laura@bluewave.ro"}},
            {"name": "Green Energy Solutions", "phone": "+40 766 888 999", "email": "solar@greenenergy.ro", "address": "Soseaua Pipera, Bucuresti", "contact": {"name": "Radu Filipescu", "email": "r.filipescu@greenenergy.ro"}},
        ]

        for c in companies_data:
            company = Company(name=c["name"], phone=c["phone"], email=c["email"], address=c["address"])
            db.add(company)
            db.flush()
            db.add(ContactPerson(company_id=company.id, name=c["contact"]["name"], email=c["contact"]["email"]))

        company_map = {c.name: c.id for c in db.query(Company).all()}

        records_data = [
            {"firm": "Acme Corporation", "status": "Finished", "periodMonth": 2, "periodYear": 2026, "dateBrought": "2026-04-05", "employee": "Sarah Johnson"},
            {"firm": "TechStart Inc.", "status": "In Progress", "periodMonth": 2, "periodYear": 2026, "dateBrought": "2026-04-08", "employee": "Michael Chen"},
            {"firm": "Global Logistics", "status": "Not Started", "periodMonth": 2, "periodYear": 2026, "dateBrought": "2026-03-28", "employee": "Maria Chicus"},
            {"firm": "Riverside Medical", "status": "In Progress", "periodMonth": 2, "periodYear": 2026, "dateBrought": "2026-04-02", "employee": "Sarah Johnson"},
            {"firm": "Downtown Retail", "status": "Finished", "periodMonth": 1, "periodYear": 2026, "dateBrought": "2026-03-10", "employee": "Michael Chen"},
            {"firm": "Mountain Coffee", "status": "Not Started", "periodMonth": 1, "periodYear": 2026, "dateBrought": "2026-03-15", "employee": "Maria Chicus"},
            {"firm": "Precision Tech", "status": "Finished", "periodMonth": 1, "periodYear": 2026, "dateBrought": "2026-03-03", "employee": "Sarah Johnson"},
            {"firm": "Blue Wave Agency", "status": "In Progress", "periodMonth": 1, "periodYear": 2026, "dateBrought": "2026-03-18", "employee": "Michael Chen"},
            {"firm": "Valley Education", "status": "Finished", "periodMonth": 0, "periodYear": 2026, "dateBrought": "2026-02-12", "employee": "Maria Chicus"},
            {"firm": "Acme Corporation", "status": "Finished", "periodMonth": 0, "periodYear": 2026, "dateBrought": "2026-02-08", "employee": "Sarah Johnson"},
            {"firm": "TechStart Inc.", "status": "In Progress", "periodMonth": 0, "periodYear": 2026, "dateBrought": "2026-02-20", "employee": "Michael Chen"},
            {"firm": "Global Logistics", "status": "Not Started", "periodMonth": 0, "periodYear": 2026, "dateBrought": "2026-02-25", "employee": "Maria Chicus"},
        ]

        for r in records_data:
            db.add(Record(
                firm=r["firm"],
                company_id=company_map.get(r["firm"]),
                employee=r["employee"],
                status=r["status"],
                periodMonth=r["periodMonth"],
                periodYear=r["periodYear"],
                dateBrought=r["dateBrought"],
            ))

        db.commit()
        print("Seeded successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()