import copy
import pytest
from fastapi.testclient import TestClient

import app.store as store
from app.main import app


@pytest.fixture(autouse=True)
def reset_store():
    original_records = copy.deepcopy(store.records)
    original_companies = copy.deepcopy(store.companies)
    original_counters = copy.deepcopy(store._counters)
    yield
    store.records.clear()
    store.records.extend(original_records)
    store.companies.clear()
    store.companies.extend(original_companies)
    store._counters.clear()
    store._counters.update(original_counters)


@pytest.fixture
def client():
    return TestClient(app)
