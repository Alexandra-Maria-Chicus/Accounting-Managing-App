from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services import log_service
from app.services.auth_service import require_role

router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("")
def get_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    _user: dict = Depends(require_role("admin")),
):
    logs = log_service.get_logs(db, limit)
    return [
        {
            "id": l.id,
            "user_email": l.user_email,
            "role": l.role,
            "action": l.action,
            "details": l.details,
            "timestamp": l.timestamp.isoformat() if l.timestamp else "",
            "ip_address": l.ip_address,
        }
        for l in logs
    ]


@router.get("/suspicious")
def get_suspicious(
    db: Session = Depends(get_db),
    _user: dict = Depends(require_role("admin")),
):
    flags = log_service.get_suspicious_users(db)
    return [
        {
            "id":             f.id,
            "user_email":     f.user_email,
            "reason":         f.reason,
            "detected_at":    f.detected_at.isoformat() if f.detected_at else "",
            "resolved":       f.resolved,
            "ai_explanation": f.ai_explanation or "",
        }
        for f in flags
    ]


@router.patch("/suspicious/{flag_id}/resolve")
def resolve_flag(
    flag_id: int,
    db: Session = Depends(get_db),
    _user: dict = Depends(require_role("admin")),
):
    flag = log_service.resolve_suspicious(db, flag_id)
    if not flag:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Flag not found")
    return {"resolved": True}
