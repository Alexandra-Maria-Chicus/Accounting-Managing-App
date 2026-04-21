import re
from typing import List
from pydantic import BaseModel, field_validator


class ContactPerson(BaseModel):
    name: str
    email: str


class Observation(BaseModel):
    id: int
    text: str
    checked: bool
    createdAt: str
    author: str


class ObservationCreate(BaseModel):
    text: str
    author: str

    @field_validator("text")
    @classmethod
    def text_valid(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("text cannot be empty")
        return v

    @field_validator("author")
    @classmethod
    def author_valid(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("author cannot be empty")
        return v


class CompanyBase(BaseModel):
    name: str
    phone: str
    email: str
    address: str
    contactPerson: ContactPerson

    @field_validator("name")
    @classmethod
    def name_valid(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name is required")
        if len(v) < 2:
            raise ValueError("name must be at least 2 characters")
        return v

    @field_validator("email")
    @classmethod
    def email_valid(cls, v: str) -> str:
        if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", v.strip()):
            raise ValueError("invalid email address")
        return v.strip()

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v: str) -> str:
        if not re.match(r"^\+?[\d\s\-(). ]{7,20}$", v.strip()):
            raise ValueError("invalid phone number")
        return v.strip()

    @field_validator("address")
    @classmethod
    def address_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 5:
            raise ValueError("address must be at least 5 characters")
        return v


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(CompanyBase):
    pass


class Company(CompanyBase):
    id: int
    observations: List[Observation] = []
