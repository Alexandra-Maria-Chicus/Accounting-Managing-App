from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from ..base import Base

class Record(Base):
    __tablename__ = "records"
    id = Column(Integer, primary_key=True)
    firm = Column(String, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    employee = Column(String)
    status = Column(String)
    periodMonth = Column("period_month", Integer)
    periodYear = Column("period_year", Integer)
    dateBrought = Column("date_brought", String)
    company = relationship("Company", back_populates="records")