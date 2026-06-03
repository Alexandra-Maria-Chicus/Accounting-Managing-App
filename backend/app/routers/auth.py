from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Request, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.models.auth_token import AuthToken
from app.db.models.organization import Organization
from app.db.models.role import Role
from app.db.models.user import User
from app.db.models.company import Company
from app.db.session import get_db
from app.services import auth_service, log_service, email_service
from app.services.company_service import get_by_registration_code

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE_NAME    = "cc_refresh"
REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "employee"
    orgName: Optional[str] = None
    staffCode: Optional[str] = None   # for admin: their org's staff code; for employee: code to find org
    firmCode: Optional[str] = None


class UpdateRoleRequest(BaseModel):
    role: str


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


def _code_taken(db: Session, code: str) -> bool:
    """Returns True if the code is already used as a staff_code or registration_code."""
    code = code.strip().upper()
    if db.query(Organization).filter(Organization.staff_code == code).first():
        return True
    if db.query(Company).filter(Company.registration_code == code).first():
        return True
    return False


@router.post("/login")
async def login(data: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
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
    token = auth_service.create_auth_token(db, data.email, "2fa_link", user.id)
    await email_service.send_2fa_login_link(user.email, token)

    log_service.log_action(
        db, user_email=result["email"], role=result["role"],
        action="LOGIN_2FA", details=f"2FA link sent to {data.email}",
        ip_address=request.client.host, user_id=result["id"],
    )
    return {"requires_2fa": True, "message": "Check your email for a login link."}


@router.post("/verify-2fa-link/{token}")
def verify_2fa_link(token: str, response: Response, db: Session = Depends(get_db)):
    db_token = auth_service.validate_auth_token(db, token, "2fa_link")
    user = db.query(User).filter(User.id == db_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User target missing.")

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


@router.get("/check-code")
def check_code(
    code: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    """Returns whether a code is already taken (as staff code or firm registration code)."""
    return {"taken": _code_taken(db, code)}


@router.post("/register", status_code=201)
async def register(data: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    if data.role not in ("employee", "client", "admin"):
        raise HTTPException(status_code=400, detail="role must be 'employee', 'client', or 'admin'")

    if auth_service.get_user_by_email(db, data.email):
        raise HTTPException(status_code=409, detail="Email already registered")

    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    company_id = None
    company = None
    org_id = None

    if data.role == "admin":
        if not data.orgName or not data.orgName.strip():
            raise HTTPException(status_code=400, detail="Organisation name is required")
        if not data.staffCode or not data.staffCode.strip():
            raise HTTPException(status_code=400, detail="Staff code is required")
        clean_staff = data.staffCode.strip().upper()
        if len(clean_staff) < 4:
            raise HTTPException(status_code=400, detail="Staff code must be at least 4 characters")
        if _code_taken(db, clean_staff):
            raise HTTPException(status_code=409, detail="That staff code is already in use")
        org = Organization(name=data.orgName.strip(), staff_code=clean_staff)
        db.add(org)
        db.flush()
        org_id = org.id

    elif data.role == "employee":
        if not data.staffCode:
            raise HTTPException(status_code=400, detail="Staff code is required for employee registration")
        org = db.query(Organization).filter(
            Organization.staff_code == data.staffCode.strip().upper()
        ).first()
        if not org:
            raise HTTPException(status_code=403, detail="Invalid staff code")
        org_id = org.id

    elif data.role == "client":
        if not data.firmCode:
            raise HTTPException(status_code=400, detail="Firm code is required for client registration")
        company = get_by_registration_code(db, data.firmCode)
        if not company:
            raise HTTPException(status_code=404, detail="No company found with that firm code. Please check the code your accountant gave you.")
        company_id = company.id
        org_id = company.organization_id

    role_obj = db.query(Role).filter(Role.name == data.role).first()
    if not role_obj:
        raise HTTPException(status_code=500, detail="Role configuration error — contact admin")

    user = User(
        email=data.email.strip(),
        password_hash=auth_service.hash_password(data.password),
        name=data.name.strip(),
        role_id=role_obj.id,
        company_id=company_id,
        organization_id=org_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    confirm_token = auth_service.create_auth_token(db, user.email, "confirm_email", user.id, expires_minutes=24*60)
    await email_service.send_email_confirmation(user.email, confirm_token)

    return {"requires_confirmation": True, "message": "Check your email to confirm your account."}


@router.post("/confirm-email/{token}")
def confirm_email(token: str, response: Response, db: Session = Depends(get_db)):
    db_token = auth_service.validate_auth_token(db, token, "confirm_email")
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


@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.get_current_user),
):
    org_id = current_user.get("organization_id")
    users = db.query(User).filter(User.organization_id == org_id).all()
    return [
        {"id": u.id, "name": u.name, "email": u.email, "role": u.role.name}
        for u in users
    ]


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    data: UpdateRoleRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.require_role("admin")),
):
    if data.role not in ("admin", "employee"):
        raise HTTPException(status_code=400, detail="role must be 'admin' or 'employee'")
    if current_user["id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")

    org_id = current_user.get("organization_id")
    user = db.query(User).filter(User.id == user_id, User.organization_id == org_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found in your organisation")

    role_obj = db.query(Role).filter(Role.name == data.role).first()
    if not role_obj:
        raise HTTPException(status_code=500, detail="Role configuration error")

    user.role_id = role_obj.id
    db.commit()
    db.refresh(user)
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role.name}


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
            # Invalidate any pending 2FA link for this user so old emails can't be reused
            db.query(AuthToken).filter(
                AuthToken.user_id == db_token.user_id,
                AuthToken.type    == "2fa_link",
                AuthToken.used    == False,
            ).update({"used": True})
            db.commit()

    response.delete_cookie(REFRESH_COOKIE_NAME, path="/auth/refresh")
    return {"message": "Logged out"}


@router.get("/me")
def me(current_user: dict = Depends(auth_service.get_current_user)):
    return current_user


@router.get("/profile")
def get_profile(
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.get_current_user),
):
    user = db.query(User).filter(User.id == current_user["id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id":    user.id,
        "name":  user.name,
        "email": user.email,
        "role":  user.role.name,
        "organization": {
            "id":         user.organization.id,
            "name":       user.organization.name,
            "staff_code": user.organization.staff_code if user.role.name == "admin" else None,
        } if user.organization else None,
        "company": {
            "id":    user.company.id,
            "name":  user.company.name,
            "email": user.company.email,
        } if user.company else None,
    }


@router.delete("/me", status_code=204)
def delete_my_account(
    response: Response,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_service.get_current_user),
):
    from app.db.models.log import Log
    from app.db.models.suspicious_user import SuspiciousUser

    user = db.query(User).filter(User.id == current_user["id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user["role"] == "admin":
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        admin_count = db.query(User).filter(
            User.organization_id == user.organization_id,
            User.role_id == admin_role.id,
        ).count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=403,
                detail="You are the only admin in your organisation. Promote another user to admin before deleting your account.",
            )

    # Preserve audit trail — nullify FK, keep the rows
    db.query(Log).filter(Log.user_id == user.id).update({"user_id": None})
    db.query(SuspiciousUser).filter(SuspiciousUser.user_id == user.id).update({"user_id": None})
    # Remove auth tokens — they are useless without the user
    db.query(AuthToken).filter(AuthToken.user_id == user.id).delete()

    db.delete(user)
    db.commit()
    response.delete_cookie(REFRESH_COOKIE_NAME, path="/auth/refresh")
    return None


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
