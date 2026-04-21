VALID_RECORD = {
    "firm": "Test Corp",
    "employee": "Jane Doe",
    "status": "Not Started",
    "periodMonth": 3,
    "periodYear": 2026,
    "dateBrought": "2026-04-01",
}


# ── List / pagination ──────────────────────────────────────────────────────────

def test_list_returns_paged_response(client):
    r = client.get("/records")
    assert r.status_code == 200
    data = r.json()
    assert {"items", "total", "page", "page_size", "total_pages"} <= data.keys()


def test_list_page_size_respected(client):
    r = client.get("/records?page=1&page_size=3")
    assert r.status_code == 200
    assert len(r.json()["items"]) == 3


def test_list_filter_by_month_and_year(client):
    r = client.get("/records?month=2&year=2026")
    assert r.status_code == 200
    items = r.json()["items"]
    assert all(i["periodMonth"] == 2 and i["periodYear"] == 2026 for i in items)


def test_list_second_page(client):
    r1 = client.get("/records?page=1&page_size=5")
    r2 = client.get("/records?page=2&page_size=5")
    ids1 = {i["id"] for i in r1.json()["items"]}
    ids2 = {i["id"] for i in r2.json()["items"]}
    assert ids1.isdisjoint(ids2)


# ── Get single ────────────────────────────────────────────────────────────────

def test_get_existing_record(client):
    r = client.get("/records/1")
    assert r.status_code == 200
    assert r.json()["id"] == 1


def test_get_missing_record_returns_404(client):
    r = client.get("/records/9999")
    assert r.status_code == 404


# ── Create ────────────────────────────────────────────────────────────────────

def test_create_record_success(client):
    r = client.post("/records", json=VALID_RECORD)
    assert r.status_code == 201
    data = r.json()
    assert data["firm"] == "Test Corp"
    assert "id" in data


def test_create_record_empty_firm(client):
    r = client.post("/records", json={**VALID_RECORD, "firm": ""})
    assert r.status_code == 422


def test_create_record_short_firm(client):
    r = client.post("/records", json={**VALID_RECORD, "firm": "X"})
    assert r.status_code == 422


def test_create_record_empty_employee(client):
    r = client.post("/records", json={**VALID_RECORD, "employee": ""})
    assert r.status_code == 422


def test_create_record_invalid_status(client):
    r = client.post("/records", json={**VALID_RECORD, "status": "Unknown"})
    assert r.status_code == 422


def test_create_record_invalid_month_high(client):
    r = client.post("/records", json={**VALID_RECORD, "periodMonth": 12})
    assert r.status_code == 422


def test_create_record_invalid_month_low(client):
    r = client.post("/records", json={**VALID_RECORD, "periodMonth": -1})
    assert r.status_code == 422


def test_create_record_invalid_year(client):
    r = client.post("/records", json={**VALID_RECORD, "periodYear": 1999})
    assert r.status_code == 422


def test_create_record_invalid_date(client):
    r = client.post("/records", json={**VALID_RECORD, "dateBrought": "not-a-date"})
    assert r.status_code == 422


# ── Update ────────────────────────────────────────────────────────────────────

def test_update_record_success(client):
    r = client.put("/records/1", json={**VALID_RECORD, "firm": "Updated Corp", "status": "Finished"})
    assert r.status_code == 200
    assert r.json()["firm"] == "Updated Corp"
    assert r.json()["status"] == "Finished"


def test_update_record_not_found(client):
    r = client.put("/records/9999", json=VALID_RECORD)
    assert r.status_code == 404


def test_update_record_invalid_payload(client):
    r = client.put("/records/1", json={**VALID_RECORD, "firm": ""})
    assert r.status_code == 422


# ── Delete ────────────────────────────────────────────────────────────────────

def test_delete_record_success(client):
    client.post("/records", json=VALID_RECORD)
    all_records = client.get("/records?page_size=100").json()["items"]
    new_id = all_records[0]["id"]
    r = client.delete(f"/records/{new_id}")
    assert r.status_code == 204
    assert client.get(f"/records/{new_id}").status_code == 404


def test_delete_record_not_found(client):
    r = client.delete("/records/9999")
    assert r.status_code == 404


# ── Stats ─────────────────────────────────────────────────────────────────────

def test_stats_shape(client):
    r = client.get("/records/stats")
    assert r.status_code == 200
    data = r.json()
    assert "total" in data
    assert "by_status" in data
    assert "by_employee" in data
    assert "by_month" in data


def test_stats_total_matches_store(client):
    total_from_list = client.get("/records?page_size=100").json()["total"]
    total_from_stats = client.get("/records/stats").json()["total"]
    assert total_from_list == total_from_stats
