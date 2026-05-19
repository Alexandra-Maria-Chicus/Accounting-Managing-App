import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User
from app.db.models.auth_token import AuthToken
from app.db.models.role_permission import RolePermission
from app.db.models.permission import Permission

SECRET_KEY                  = os.getenv("SECRET_KEY", "super_secret_change_this")
ALGORITHM                   = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS   = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS",   "7"))
STAFF_REGISTRATION_CODE     = os.getenv("STAFF_REGISTRATION_CODE", "STAFF-2026")

_bearer = HTTPBearer(auto_error=False)


# ── Password helpers ──────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


# ── Permission loader ─────────────────────────────────────────────────────────

def _get_permissions_for_role(db: Session, role_id: int) -> list[str]:
    rows = (
        db.query(Permission.name)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .filter(RolePermission.role_id == role_id)
        .all()
    )
    return [r[0] for r in rows]


# ── JWT access token ──────────────────────────────────────────────────────────

def create_access_token(user: User, db: Session) -> str:
    permissions = _get_permissions_for_role(db, user.role_id)
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub":         user.email,
        "id":          user.id,
        "role":        user.role.name,
        "permissions": permissions,
        "name":        user.name,
        "company":     user.company.name if user.company else None,
        "exp":         expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ── Refresh token ─────────────────────────────────────────────────────────────

def create_refresh_token(db: Session, user: User) -> str:
    token_str = secrets.token_urlsafe(64)
    expires   = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    db_token  = AuthToken(
        token=token_str,
        user_id=user.id,
        email=user.email,
        type="refresh",
        expires_at=expires,
        used=False,
    )
    db.add(db_token)
    db.commit()
    return token_str


# ── One-time tokens (reset + magic) ──────────────────────────────────────────

def create_auth_token(db: Session, email: str, token_type: str, user_id: Optional[int] = None) -> str:
    token_str = secrets.token_urlsafe(32)
    expires   = datetime.now(timezone.utc) + timedelta(minutes=15)
    db_token  = AuthToken(
        token=token_str,
        user_id=user_id,
        email=email,
        type=token_type,
        expires_at=expires,
        used=False,
    )
    db.add(db_token)
    db.commit()
    return token_str


def validate_auth_token(db: Session, token_str: str, expected_type: str) -> AuthToken:
    db_token = db.query(AuthToken).filter(
        AuthToken.token == token_str,
        AuthToken.type  == expected_type,
    ).first()

    if not db_token:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    if db_token.used:
        raise HTTPException(status_code=400, detail="This link has already been used")
    if datetime.now(timezone.utc) > db_token.expires_at.replace(tzinfo=timezone.utc):
        raise HTTPException(status_code=400, detail="This link has expired")

    return db_token


# ── JWT decode helpers ────────────────────────────────────────────────────────

def _credentials_exception():
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("sub") is None:
            raise _credentials_exception()
        return payload
    except JWTError:
        raise _credentials_exception()


# ── FastAPI dependencies ──────────────────────────────────────────────────────

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> dict:
    if credentials is None:
        raise _credentials_exception()
    return decode_token(credentials.credentials)


def require_role(*allowed_roles: str):
    def _check(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {allowed_roles}",
            )
        return current_user
    return _check


def require_permission(*required_permissions: str):
    def _check(current_user: dict = Depends(get_current_user)):
        user_perms = set(current_user.get("permissions", []))
        for perm in required_permissions:
            if perm not in user_perms:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing permission: {perm}",
                )
        return current_user
    return _check


# ── Login helper ──────────────────────────────────────────────────────────────

def login(db: Session, email: str, password: str) -> Optional[dict]:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        return None
    token = create_access_token(user, db)
    return {
        "access_token": token,
        "token_type":   "bearer",
        "id":           user.id,
        "email":        user.email,
        "name":         user.name,
        "role":         user.role.name,
        "permissions":  _get_permissions_for_role(db, user.role_id),
        "companyName":  user.company.name if user.company else None,
    }
