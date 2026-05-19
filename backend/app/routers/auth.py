from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.models.auth_token import AuthToken
from app.db.models.role import Role
from app.db.models.user import User
from app.db.session import get_db
from app.services import auth_service, log_service, email_service
from app.services.company_service import get_by_registration_code

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE_NAME    = "cc_refresh"
REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60  # 7 days in seconds


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "employee"
    staffCode: Optional[str] = None
    firmCode: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    password: str


class MagicLinkRequest(BaseModel):
    email: str


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=REFRESH_COOKIE_MAX_AGE,
        path="/auth/refresh",
    )


@router.post("/login")
def login(data: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    result = auth_service.login(db, data.email, data.password)
    if not result:
        log_service.log_action(
            db, user_email=data.email, role="unknown",
            action="LOGIN_FAILED",
            details=f"Failed login attempt for {data.email}",
            ip_address=request.client.host,
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = auth_service.get_user_by_email(db, data.email)
    refresh_token = auth_service.create_refresh_token(db, user)
    _set_refresh_cookie(response, refresh_token)

    log_service.log_action(
        db, user_email=result["email"], role=result["role"],
        action="LOGIN", details=f"User {result['name']} logged in",
        ip_address=request.client.host, user_id=result["id"],
    )
    return result


@router.post("/register", status_code=201)
def register(data: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    if data.role not in ("employee", "client"):
        raise HTTPException(status_code=400, detail="role must be 'employee' or 'client'")

    if auth_service.get_user_by_email(db, data.email):
        raise HTTPException(status_code=409, detail="Email already registered")

    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    company_id = None
    company = None

    if data.role == "employee":
        if not data.staffCode:
            raise HTTPException(status_code=400, detail="Staff code is required for employee registration")
        if data.staffCode.strip() != auth_service.STAFF_REGISTRATION_CODE:
            raise HTTPException(status_code=403, detail="Invalid staff code")

    elif data.role == "client":
        if not data.firmCode:
            raise HTTPException(status_code=400, detail="Firm code is required for client registration")
        company = get_by_registration_code(db, data.firmCode)
        if not company:
            raise HTTPException(status_code=404, detail="No company found with that firm code. Please check the code your accountant gave you.")
        company_id = company.id

    role_obj = db.query(Role).filter(Role.name == data.role).first()
    if not role_obj:
        raise HTTPException(status_code=500, detail="Role configuration error — contact admin")

    user = User(
        email=data.email.strip(),
        password_hash=auth_service.hash_password(data.password),
        name=data.name.strip(),
        role_id=role_obj.id,
        company_id=company_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = auth_service.create_access_token(user, db)
    refresh_token = auth_service.create_refresh_token(db, user)
    _set_refresh_cookie(response, refresh_token)

    return {
        "access_token": token,
        "token_type":   "bearer",
        "id":           user.id,
        "email":        user.email,
        "name":         user.name,
        "role":         data.role,
        "permissions":  auth_service._get_permissions_for_role(db, role_obj.id),
        "companyName":  company.name if company else None,
    }


@router.post("/refresh")
def refresh(
    response: Response,
    db: Session = Depends(get_db),
    cc_refresh: Optional[str] = Cookie(default=None),
):
    if not cc_refresh:
        raise HTTPException(status_code=401, detail="No refresh token")

    db_token = auth_service.validate_auth_token(db, cc_refresh, "refresh")
    db_token.used = True
    db.commit()

    user = db.query(User).filter(User.id == db_token.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_access  = auth_service.create_access_token(user, db)
    new_refresh = auth_service.create_refresh_token(db, user)
    _set_refresh_cookie(response, new_refresh)

    return {"access_token": new_access, "token_type": "bearer"}


@router.post("/logout")
def logout(
    response: Response,
    db: Session = Depends(get_db),
    cc_refresh: Optional[str] = Cookie(default=None),
):
    if cc_refresh:
        db_token = db.query(AuthToken).filter(
            AuthToken.token == cc_refresh,
            AuthToken.type  == "refresh",
        ).first()
        if db_token:
            db_token.used = True
            db.commit()

    response.delete_cookie(REFRESH_COOKIE_NAME, path="/auth/refresh")
    return {"message": "Logged out"}


@router.get("/me")
def me(current_user: dict = Depends(auth_service.get_current_user)):
    return current_user


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = auth_service.get_user_by_email(db, data.email)
    if user:
        token = auth_service.create_auth_token(db, data.email, "reset", user.id)
        try:
            await email_service.send_password_reset(data.email, token)
        except Exception:
            pass
    return {"message": "If that email is registered, you will receive a reset link shortly."}


@router.post("/reset-password/{token}")
def reset_password(token: str, data: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    db_token = auth_service.validate_auth_token(db, token, "reset")
    user = db.query(User).filter(User.id == db_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = auth_service.hash_password(data.password)
    db_token.used = True
    db.commit()

    return {"message": "Password updated successfully. You can now log in."}


@router.post("/magic/request")
async def magic_link_request(data: MagicLinkRequest, db: Session = Depends(get_db)):
    user = auth_service.get_user_by_email(db, data.email)
    if user:
        token = auth_service.create_auth_token(db, data.email, "magic", user.id)
        try:
            await email_service.send_magic_link(data.email, token)
        except Exception:
            pass
    return {"message": "If that email is registered, you will receive a login link shortly."}


@router.get("/magic/{token}")
def magic_link_validate(token: str, response: Response, db: Session = Depends(get_db)):
    db_token = auth_service.validate_auth_token(db, token, "magic")
    user = db.query(User).filter(User.id == db_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db_token.used = True
    db.commit()

    access_token  = auth_service.create_access_token(user, db)
    refresh_token = auth_service.create_refresh_token(db, user)
    _set_refresh_cookie(response, refresh_token)

    return {
        "access_token": access_token,
        "token_type":   "bearer",
        "id":           user.id,
        "email":        user.email,
        "name":         user.name,
        "role":         user.role.name,
        "companyName":  user.company.name if user.company else None,
    }
