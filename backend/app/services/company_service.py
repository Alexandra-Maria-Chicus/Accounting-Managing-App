from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app import store
from app.models.company import CompanyCreate, CompanyUpdate, ObservationCreate


def get_all() -> List[Dict]:
    return store.companies


def get_by_id(company_id: int) -> Optional[Dict]:
    return next((c for c in store.companies if c["id"] == company_id), None)


def create(data: CompanyCreate) -> Dict:
    if any(c["name"].lower() == data.name.lower() for c in store.companies):
        raise ValueError(f"Company with name '{data.name}' already exists")
    new_company = {"id": store.next_id("companies"), **data.model_dump(), "observations": []}
    store.companies.append(new_company)
    return new_company


def update(company_id: int, data: CompanyUpdate) -> Optional[Dict]:
    if any(
        c["name"].lower() == data.name.lower() and c["id"] != company_id
        for c in store.companies
    ):
        raise ValueError(f"Company with name '{data.name}' already exists")
    for i, c in enumerate(store.companies):
        if c["id"] == company_id:
            store.companies[i] = {
                "id": company_id,
                **data.model_dump(),
                "observations": c["observations"],
            }
            return store.companies[i]
    return None


def delete(company_id: int) -> bool:
    for i, c in enumerate(store.companies):
        if c["id"] == company_id:
            store.companies.pop(i)
            return True
    return False


def add_observation(company_id: int, data: ObservationCreate) -> Optional[Dict]:
    company = get_by_id(company_id)
    if not company:
        return None
    obs: Dict[str, Any] = {
        "id": store.next_id("observations"),
        "text": data.text,
        "author": data.author,
        "checked": False,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    company["observations"].append(obs)
    return obs


def toggle_observation(company_id: int, obs_id: int) -> Optional[Dict]:
    company = get_by_id(company_id)
    if not company:
        return None
    for obs in company["observations"]:
        if obs["id"] == obs_id:
            obs["checked"] = not obs["checked"]
            return obs
    return None


def delete_observation(company_id: int, obs_id: int) -> bool:
    company = get_by_id(company_id)
    if not company:
        return False
    before = len(company["observations"])
    company["observations"] = [o for o in company["observations"] if o["id"] != obs_id]
    return len(company["observations"]) < before
