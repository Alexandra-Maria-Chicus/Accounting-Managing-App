import os
import httpx
from sqlalchemy.orm import Session
from app.db.models import Log, SuspiciousUser

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL    = os.getenv("OLLAMA_MODEL",    "llama3.2")


def _format_logs_for_prompt(logs: list) -> str:
    lines = []
    for log in logs:
        ts = log.timestamp.strftime("%H:%M:%S") if log.timestamp else "unknown"
        lines.append(f"  [{ts}] {log.action} — {log.details or 'no details'} (IP: {log.ip_address or 'unknown'})")
    return "\n".join(lines)


def generate_ai_explanation(db: Session, user_email: str, reason: str) -> str:
    """
    Fetches the last 20 log entries for user_email, sends them to Ollama,
    and returns a concise explanation. Falls back to a template if Ollama
    is not running.
    """
    logs = (
        db.query(Log)
        .filter(Log.user_email == user_email)
        .order_by(Log.timestamp.desc())
        .limit(20)
        .all()
    )

    if not logs:
        return f"Flagged automatically: {reason}"

    log_text = _format_logs_for_prompt(logs)

    prompt = f"""You are a security analyst reviewing user activity logs for a web application.

User email: {user_email}
Automated detection reason: {reason}

Recent activity log (most recent first):
{log_text}

In 2-3 sentences, explain why this user's behaviour is suspicious and what type of attack or misuse it might indicate. Be specific about the patterns you see. Do not use bullet points. Do not repeat the raw log data. Write as if explaining to a system administrator."""

    try:
        response = httpx.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model":  OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.3,
                    "num_predict": 150,
                },
            },
            timeout=30.0,
        )
        if response.status_code == 200:
            explanation = response.json().get("response", "").strip()
            if explanation:
                return explanation
    except Exception:
        pass

    delete_count  = sum(1 for l in logs if l.action == "DELETE")
    failed_logins = sum(1 for l in logs if l.action == "LOGIN_FAILED")
    total         = len(logs)
    return (
        f"This user generated {total} requests in a short time window. "
        f"The activity included {delete_count} deletion operations and "
        f"{failed_logins} failed login attempts. "
        f"Automated detection reason: {reason}"
    )


def flag_with_ai_explanation(db: Session, flag: SuspiciousUser) -> None:
    explanation = generate_ai_explanation(db, flag.user_email, flag.reason)
    flag.ai_explanation = explanation
    db.commit()
