from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from ..base import Base


class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    staff_code = Column(String, unique=True, nullable=False)
    users = relationship("User", back_populates="organization")
    companies = relationship("Company", back_populates="organization")
    records = relationship("Record", back_populates="organization")
