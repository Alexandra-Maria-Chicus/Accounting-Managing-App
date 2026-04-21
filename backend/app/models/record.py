from typing import Literal
from pydantic import BaseModel, field_validator


class RecordBase(BaseModel):
    firm: str
    employee: str
    status: Literal["Not Started", "In Progress", "Finished"]
    periodMonth: int
    periodYear: int
    dateBrought: str  # ISO date string YYYY-MM-DD

    @field_validator("firm")
    @classmethod
    def firm_valid(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("firm cannot be empty")
        if len(v) < 2:
            raise ValueError("firm must be at least 2 characters")
        return v

    @field_validator("employee")
    @classmethod
    def employee_valid(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("employee cannot be empty")
        return v

    @field_validator("periodMonth")
    @classmethod
    def month_valid(cls, v: int) -> int:
        if not 0 <= v <= 11:
            raise ValueError("periodMonth must be between 0 and 11")
        return v

    @field_validator("periodYear")
    @classmethod
    def year_valid(cls, v: int) -> int:
        if not 2000 <= v <= 2100:
            raise ValueError("periodYear must be between 2000 and 2100")
        return v

    @field_validator("dateBrought")
    @classmethod
    def date_valid(cls, v: str) -> str:
        from datetime import date
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError("dateBrought must be a valid ISO date (YYYY-MM-DD)")
        return v


class RecordCreate(RecordBase):
    pass


class RecordUpdate(RecordBase):
    pass


class Record(RecordBase):
    id: int
