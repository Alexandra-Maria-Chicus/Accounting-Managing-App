from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from ..base import Base

class Permission(Base):
    __tablename__ = "permissions"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    role_permissions = relationship("RolePermission", back_populates="permission")