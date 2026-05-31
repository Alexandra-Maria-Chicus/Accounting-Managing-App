from sqlalchemy import Column, Integer, String
from ..base import Base


class AppSettings(Base):
    __tablename__ = "app_settings"
    id = Column(Integer, primary_key=True)
    staff_registration_code = Column(String, nullable=False, default="STAFF-2026")
