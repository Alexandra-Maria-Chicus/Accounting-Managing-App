from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.session import get_db
from app.services import auth_service, log_service

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = auth_service.login(db, data.email, data.password)
    if not user:
        log_service.log_action(
            db,
            user_email=data.email,
            role="unknown",
            action="LOGIN_FAILED",
            details=f"Failed login attempt for {data.email}",
            ip_address=request.client.host,
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    log_service.log_action(
        db,
        user_email=user["email"],
        role=user["role"],
        action="LOGIN",
        details=f"User {user['name']} logged in",
        ip_address=request.client.host,
        user_id=user["id"],
    )
    return user