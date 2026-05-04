from typing import List, Optional

import strawberry
from strawberry.fastapi import GraphQLRouter
from strawberry.types import Info
from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Record as RecordORM, Company as CompanyORM, Observation as ObservationORM
from app.models.record import RecordCreate, RecordUpdate
from app.models.company import ObservationCreate
from app.services import record_service, company_service


# ── Output types ──────────────────────────────────────────────────────────────

@strawberry.type
class RecordType:
    id: int
    firm: str
    employee: str
    status: str
    periodMonth: int
    periodYear: int
    dateBrought: str


@strawberry.type
class PagedRecords:
    items: List[RecordType]
    total: int
    page: int
    page_size: int
    total_pages: int


@strawberry.type
class ObservationType:
    id: int
    text: str
    checked: bool
    createdAt: str
    author: str


@strawberry.type
class ContactPersonType:
    name: str
    email: str


@strawberry.type
class CompanyType:
    id: int
    name: str
    phone: str
    email: str
    address: str
    contactPerson: ContactPersonType
    observations: List[ObservationType]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _to_record_type(r: RecordORM) -> RecordType:
    return RecordType(
        id=r.id,
        firm=r.firm,
        employee=r.employee,
        status=r.status,
        periodMonth=r.period_month,
        periodYear=r.period_year,
        dateBrought=r.date_brought,
    )


def _to_company_type(c: CompanyORM) -> CompanyType:
    return CompanyType(
        id=c.id,
        name=c.name,
        phone=c.phone,
        email=c.email,
        address=c.address,
        contactPerson=ContactPersonType(
            name=c.contact_person.name,
            email=c.contact_person.email,
        ),
        observations=[
            ObservationType(
                id=o.id,
                text=o.text,
                checked=o.checked,
                createdAt=o.created_at.isoformat() if o.created_at else "",
                author=o.author,
            )
            for o in c.observations
        ],
    )


# ── Context ───────────────────────────────────────────────────────────────────

async def get_context(db: Session = Depends(get_db)):
    return {"db": db}


# ── Query ─────────────────────────────────────────────────────────────────────

@strawberry.type
class Query:
    @strawberry.field
    def records(
        self,
        info: Info,
        page: int = 1,
        page_size: int = 5,
        month: Optional[int] = None,
        year: Optional[int] = None,
    ) -> PagedRecords:
        db = info.context["db"]
        result = record_service.get_all(db, page, page_size, month, year)
        return PagedRecords(
            items=[_to_record_type(r) for r in result["items"]],
            total=result["total"],
            page=result["page"],
            page_size=result["page_size"],
            total_pages=result["total_pages"],
        )

    @strawberry.field
    def record(self, info: Info, id: int) -> Optional[RecordType]:
        db = info.context["db"]
        r = record_service.get_by_id(db, id)
        return _to_record_type(r) if r else None

    @strawberry.field
    def companies(self, info: Info) -> List[CompanyType]:
        db = info.context["db"]
        return [_to_company_type(c) for c in company_service.get_all(db)]

    @strawberry.field
    def company(self, info: Info, id: int) -> Optional[CompanyType]:
        db = info.context["db"]
        c = company_service.get_by_id(db, id)
        return _to_company_type(c) if c else None

    @strawberry.field
    def record_stats(self, info: Info) -> strawberry.scalars.JSON:
        db = info.context["db"]
        return record_service.get_stats(db)


# ── Input types ───────────────────────────────────────────────────────────────

@strawberry.input
class RecordInput:
    firm: str
    employee: str
    status: str
    periodMonth: int
    periodYear: int
    dateBrought: str


@strawberry.input
class ObservationInput:
    text: str
    author: str


# ── Mutation ──────────────────────────────────────────────────────────────────

@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_record(self, info: Info, input: RecordInput) -> RecordType:
        db = info.context["db"]
        data = RecordCreate(
            firm=input.firm,
            employee=input.employee,
            status=input.status,
            periodMonth=input.periodMonth,
            periodYear=input.periodYear,
            dateBrought=input.dateBrought,
        )
        return _to_record_type(record_service.create(db, data))

    @strawberry.mutation
    def update_record(self, info: Info, id: int, input: RecordInput) -> Optional[RecordType]:
        db = info.context["db"]
        data = RecordUpdate(
            firm=input.firm,
            employee=input.employee,
            status=input.status,
            periodMonth=input.periodMonth,
            periodYear=input.periodYear,
            dateBrought=input.dateBrought,
        )
        r = record_service.update(db, id, data)
        return _to_record_type(r) if r else None

    @strawberry.mutation
    def delete_record(self, info: Info, id: int) -> bool:
        db = info.context["db"]
        return record_service.delete(db, id)

    @strawberry.mutation
    def add_observation(self, info: Info, company_id: int, input: ObservationInput) -> Optional[ObservationType]:
        db = info.context["db"]
        obs = company_service.add_observation(db, company_id, ObservationCreate(text=input.text, author=input.author))
        if not obs:
            return None
        return ObservationType(
            id=obs.id,
            text=obs.text,
            checked=obs.checked,
            createdAt=obs.created_at.isoformat() if obs.created_at else "",
            author=obs.author,
        )

    @strawberry.mutation
    def toggle_observation(self, info: Info, company_id: int, obs_id: int) -> Optional[ObservationType]:
        db = info.context["db"]
        obs = company_service.toggle_observation(db, company_id, obs_id)
        if not obs:
            return None
        return ObservationType(
            id=obs.id,
            text=obs.text,
            checked=obs.checked,
            createdAt=obs.created_at.isoformat() if obs.created_at else "",
            author=obs.author,
        )

    @strawberry.mutation
    def delete_observation(self, info: Info, company_id: int, obs_id: int) -> bool:
        db = info.context["db"]
        return company_service.delete_observation(db, company_id, obs_id)


schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_app = GraphQLRouter(schema, context_getter=get_context)