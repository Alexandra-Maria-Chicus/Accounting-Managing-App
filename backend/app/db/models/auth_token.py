from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..base import Base


class AuthToken(Base):
    __tablename__ = "auth_tokens"

    id         = Column(Integer, primary_key=True)
    token      = Column(String, unique=True, nullable=False, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=True)
    email      = Column(String, nullable=False)
    type       = Column(String, nullable=False)
    # type values:
    #   "refresh" — refresh token, stored as httpOnly cookie
    #   "reset"   — password reset link sent by email
    #   "magic"   — magic link login sent by email
    expires_at = Column(DateTime, nullable=False)
    used       = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="auth_tokens")
