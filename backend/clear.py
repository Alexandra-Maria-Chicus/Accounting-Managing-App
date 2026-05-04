from app.db.session import SessionLocal
from app.db.models import Record, Company, ContactPerson

db = SessionLocal()
db.query(Record).delete()
db.query(ContactPerson).delete()
db.query(Company).delete()
db.commit()
db.close()
print("Cleared")