from app.db.session import SessionLocal
from app.db.models import Company, ContactPerson, Record, User, Role, Permission, RolePermission
from app.services.auth_service import hash_password

def seed_companies_and_records(db):
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


def seed_roles_and_users(db):
    if db.query(Role).count() > 0:
        print("Roles already seeded, skipping.")
        return

    # Create roles
    admin_role = Role(name="admin")
    employee_role = Role(name="employee")
    client_role = Role(name="client")
    db.add_all([admin_role, employee_role, client_role])
    db.flush()

    # Create permissions
    permissions = [
        Permission(name="read_records"),
        Permission(name="write_records"),
        Permission(name="delete_records"),
        Permission(name="manage_companies"),
        Permission(name="view_own_company"),
    ]
    db.add_all(permissions)
    db.flush()

    # Assign permissions to roles
    perm_map = {p.name: p.id for p in db.query(Permission).all()}
    admin_perms = ["read_records", "write_records", "delete_records", "manage_companies"]
    employee_perms = ["read_records", "write_records"]
    client_perms = ["view_own_company"]

    for pname in admin_perms:
        db.add(RolePermission(role_id=admin_role.id, permission_id=perm_map[pname]))
    for pname in employee_perms:
        db.add(RolePermission(role_id=employee_role.id, permission_id=perm_map[pname]))
    for pname in client_perms:
        db.add(RolePermission(role_id=client_role.id, permission_id=perm_map[pname]))

    db.flush()

    role_map = {r.name: r.id for r in db.query(Role).all()}
    company_map = {c.name: c.id for c in db.query(Company).all()}

    # Create users
    users = [
        User(email="admin@completcont.ro", password_hash=hash_password("admin123"), name="Admin", role_id=role_map["admin"], company_id=None),
        User(email="maria@completcont.ro", password_hash=hash_password("employee123"), name="Maria Chicus", role_id=role_map["employee"], company_id=None),
        User(email="sarah@completcont.ro", password_hash=hash_password("employee123"), name="Sarah Johnson", role_id=role_map["employee"], company_id=None),
        User(email="michael@completcont.ro", password_hash=hash_password("employee123"), name="Michael Chen", role_id=role_map["employee"], company_id=None),
        User(email="finance@valleyedu.org", password_hash=hash_password("client123"), name="Dr. Sarah Mitchell", role_id=role_map["client"], company_id=company_map.get("Valley Education")),
        User(email="j.doe@acme.com", password_hash=hash_password("client123"), name="John Doe", role_id=role_map["client"], company_id=company_map.get("Acme Corporation")),
        User(email="alice@techstart.io", password_hash=hash_password("client123"), name="Alice Vance", role_id=role_map["client"], company_id=company_map.get("TechStart Inc.")),
        User(email="m.stevens@global.ro", password_hash=hash_password("client123"), name="Mark Stevens", role_id=role_map["client"], company_id=company_map.get("Global Logistics")),
        User(email="e.popescu@riverside.med", password_hash=hash_password("client123"), name="Elena Popescu", role_id=role_map["client"], company_id=company_map.get("Riverside Medical")),
        User(email="g.marin@downtown.ro", password_hash=hash_password("client123"), name="George Marin", role_id=role_map["client"], company_id=company_map.get("Downtown Retail")),
        User(email="ana@mtncoffee.com", password_hash=hash_password("client123"), name="Ana Maria", role_id=role_map["client"], company_id=company_map.get("Mountain Coffee")),
        User(email="v.ionescu@prectech.ro", password_hash=hash_password("client123"), name="Victor Ionescu", role_id=role_map["client"], company_id=company_map.get("Precision Tech")),
        User(email="laura@bluewave.ro", password_hash=hash_password("client123"), name="Laura Dumitru", role_id=role_map["client"], company_id=company_map.get("Blue Wave Agency")),
        User(email="r.filipescu@greenenergy.ro", password_hash=hash_password("client123"), name="Radu Filipescu", role_id=role_map["client"], company_id=company_map.get("Green Energy Solutions")),
    ]
    db.add_all(users)
    db.commit()
    print("Roles and users seeded successfully.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_companies_and_records(db)
        seed_roles_and_users(db)
    finally:
        db.close()