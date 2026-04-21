from typing import List, Optional

import strawberry
from strawberry.fastapi import GraphQLRouter

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

def _to_record_type(r: dict) -> RecordType:
    return RecordType(
        id=r["id"],
        firm=r["firm"],
        employee=r["employee"],
        status=r["status"],
        periodMonth=r["periodMonth"],
        periodYear=r["periodYear"],
        dateBrought=r["dateBrought"],
    )


def _to_company_type(c: dict) -> CompanyType:
    return CompanyType(
        id=c["id"],
        name=c["name"],
        phone=c["phone"],
        email=c["email"],
        address=c["address"],
        contactPerson=ContactPersonType(
            name=c["contactPerson"]["name"],
            email=c["contactPerson"]["email"],
        ),
        observations=[
            ObservationType(
                id=o["id"],
                text=o["text"],
                checked=o["checked"],
                createdAt=o["createdAt"],
                author=o["author"],
            )
            for o in c["observations"]
        ],
    )


# ── Query ─────────────────────────────────────────────────────────────────────

@strawberry.type
class Query:
    @strawberry.field
    def records(
        self,
        page: int = 1,
        page_size: int = 5,
        month: Optional[int] = None,
        year: Optional[int] = None,
    ) -> PagedRecords:
        result = record_service.get_all(page, page_size, month, year)
        return PagedRecords(
            items=[_to_record_type(r) for r in result["items"]],
            total=result["total"],
            page=result["page"],
            page_size=result["page_size"],
            total_pages=result["total_pages"],
        )

    @strawberry.field
    def record(self, id: int) -> Optional[RecordType]:
        r = record_service.get_by_id(id)
        return _to_record_type(r) if r else None

    @strawberry.field
    def companies(self) -> List[CompanyType]:
        return [_to_company_type(c) for c in company_service.get_all()]

    @strawberry.field
    def company(self, id: int) -> Optional[CompanyType]:
        c = company_service.get_by_id(id)
        return _to_company_type(c) if c else None

    @strawberry.field
    def record_stats(self) -> strawberry.scalars.JSON:
        return record_service.get_stats()


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
    def create_record(self, input: RecordInput) -> RecordType:
        data = RecordCreate(
            firm=input.firm,
            employee=input.employee,
            status=input.status,  # type: ignore[arg-type]
            periodMonth=input.periodMonth,
            periodYear=input.periodYear,
            dateBrought=input.dateBrought,
        )
        return _to_record_type(record_service.create(data))

    @strawberry.mutation
    def update_record(self, id: int, input: RecordInput) -> Optional[RecordType]:
        data = RecordUpdate(
            firm=input.firm,
            employee=input.employee,
            status=input.status,  # type: ignore[arg-type]
            periodMonth=input.periodMonth,
            periodYear=input.periodYear,
            dateBrought=input.dateBrought,
        )
        r = record_service.update(id, data)
        return _to_record_type(r) if r else None

    @strawberry.mutation
    def delete_record(self, id: int) -> bool:
        return record_service.delete(id)

    @strawberry.mutation
    def add_observation(self, company_id: int, input: ObservationInput) -> Optional[ObservationType]:
        obs = company_service.add_observation(company_id, ObservationCreate(text=input.text, author=input.author))
        if not obs:
            return None
        return ObservationType(
            id=obs["id"],
            text=obs["text"],
            checked=obs["checked"],
            createdAt=obs["createdAt"],
            author=obs["author"],
        )

    @strawberry.mutation
    def toggle_observation(self, company_id: int, obs_id: int) -> Optional[ObservationType]:
        obs = company_service.toggle_observation(company_id, obs_id)
        if not obs:
            return None
        return ObservationType(
            id=obs["id"],
            text=obs["text"],
            checked=obs["checked"],
            createdAt=obs["createdAt"],
            author=obs["author"],
        )

    @strawberry.mutation
    def delete_observation(self, company_id: int, obs_id: int) -> bool:
        return company_service.delete_observation(company_id, obs_id)


schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_app = GraphQLRouter(schema)
