import bcrypt
from sqlalchemy.orm import Session
from app.db.models import User, Role

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def login(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role.name,
        "companyName": user.company.name if user.company else None,
    }