from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.analytics_service import get_stats_naive, get_stats_cached
from app.services.auth_service import require_role

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/stats-naive")
def stats_naive(
    db: Session = Depends(get_db),
    _user: dict = Depends(require_role("admin", "employee")),
):
    """Naive implementation — no caching, Python-level aggregation. Intentionally slow."""
    return get_stats_naive(db)


@router.get("/stats-cached")
def stats_cached(
    db: Session = Depends(get_db),
    _user: dict = Depends(require_role("admin", "employee")),
):
    """Optimized implementation — SQL GROUP BY + 60s in-memory cache."""
    return get_stats_cached(db)
