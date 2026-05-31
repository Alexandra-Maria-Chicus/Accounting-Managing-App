from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from ..base import Base

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    phone = Column(String)
    email = Column(String)
    address = Column(String)
    registration_code = Column(String, unique=True, nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    organization = relationship("Organization", back_populates="companies")
    contactPerson = relationship("ContactPerson", back_populates="company", uselist=False, cascade="all, delete-orphan")
    observations = relationship("Observation", back_populates="company", cascade="all, delete-orphan")
    records = relationship("Record", back_populates="company")