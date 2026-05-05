from app.db.session import SessionLocal
from app.db.models import Record, Company, ContactPerson, Observation, User, RolePermission, Role, Permission, Log, SuspiciousUser

db = SessionLocal()

db.query(SuspiciousUser).delete()
db.query(Log).delete()
db.query(Record).delete()
db.query(Observation).delete()
db.query(ContactPerson).delete()
db.query(User).delete()
db.query(RolePermission).delete()
db.query(Company).delete()
db.query(Permission).delete()
db.query(Role).delete()

db.commit()
db.close()
print("Cleared")