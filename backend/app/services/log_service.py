from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.db.models import Log, SuspiciousUser, User


def log_action(
    db: Session,
    user_email: str,
    role: str,
    action: str,
    details: str = None,
    ip_address: str = None,
    user_id: int = None,
):
    log = Log(
        user_id=user_id,
        user_email=user_email,
        role=role,
        action=action,
        details=details,
        timestamp=datetime.now(timezone.utc),
        ip_address=ip_address,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    _check_suspicious(db, user_email, role, user_id)
    return log


def _check_suspicious(db: Session, user_email: str, role: str, user_id: int = None):
    # Check 1: too many requests in last minute (more than 30)
    one_minute_ago = datetime.now(timezone.utc) - timedelta(minutes=1)
    recent_count = db.query(Log).filter(
        Log.user_email == user_email,
        Log.timestamp >= one_minute_ago,
    ).count()

    if recent_count > 30:
        _flag_suspicious(db, user_email, user_id, f"Too many requests: {recent_count} in the last minute")
        return

    # Check 2: too many deletes in last 5 minutes (more than 10)
    five_minutes_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
    delete_count = db.query(Log).filter(
        Log.user_email == user_email,
        Log.action == "DELETE",
        Log.timestamp >= five_minutes_ago,
    ).count()

    if delete_count > 10:
        _flag_suspicious(db, user_email, user_id, f"Too many deletions: {delete_count} in the last 5 minutes")
        return

    # Check 3: too many failed logins in last 10 minutes (more than 5)
    ten_minutes_ago = datetime.now(timezone.utc) - timedelta(minutes=10)
    failed_logins = db.query(Log).filter(
        Log.user_email == user_email,
        Log.action == "LOGIN_FAILED",
        Log.timestamp >= ten_minutes_ago,
    ).count()

    if failed_logins > 5:
        _flag_suspicious(db, user_email, user_id, f"Too many failed logins: {failed_logins} in the last 10 minutes")


def _flag_suspicious(db: Session, user_email: str, user_id: int, reason: str):
    # don't add duplicate flags
    existing = db.query(SuspiciousUser).filter(
        SuspiciousUser.user_email == user_email,
        SuspiciousUser.resolved == False,
        SuspiciousUser.reason == reason,
    ).first()
    if existing:
        return
    flag = SuspiciousUser(
        user_id=user_id,
        user_email=user_email,
        reason=reason,
        detected_at=datetime.now(timezone.utc),
        resolved=False,
    )
    db.add(flag)
    db.commit()


def get_logs(db: Session, limit: int = 100):
    return db.query(Log).order_by(Log.timestamp.desc()).limit(limit).all()


def get_suspicious_users(db: Session):
    return db.query(SuspiciousUser).filter(
        SuspiciousUser.resolved == False
    ).order_by(SuspiciousUser.detected_at.desc()).all()


def resolve_suspicious(db: Session, flag_id: int):
    flag = db.query(SuspiciousUser).filter(SuspiciousUser.id == flag_id).first()
    if flag:
        flag.resolved = True
        db.commit()
    return flag