from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from ..base import Base

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    phone = Column(String)
    email = Column(String)
    address = Column(String)
    contactPerson = relationship("ContactPerson", back_populates="company", uselist=False, cascade="all, delete-orphan")
    observations = relationship("Observation", back_populates="company", cascade="all, delete-orphan")
    records = relationship("Record", back_populates="company")