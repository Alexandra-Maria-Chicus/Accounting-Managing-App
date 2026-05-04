from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from ..base import Base

class Observation(Base):
    __tablename__ = "observations"
    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    text = Column(String)
    checked = Column(Boolean, default=False)
    createdAt = Column("created_at", DateTime)
    author = Column(String)
    company = relationship("Company", back_populates="observations")