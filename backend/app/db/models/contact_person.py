from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from ..base import Base

class ContactPerson(Base):
    __tablename__ = "contact_persons"
    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), unique=True)
    name = Column(String)
    email = Column(String)
    company = relationship("Company", back_populates="contactPerson")