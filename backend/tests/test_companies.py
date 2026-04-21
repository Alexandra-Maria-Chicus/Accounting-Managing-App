VALID_COMPANY = {
    "name": "Brand New Corp",
    "phone": "+40 700 111 222",
    "email": "hello@brandnew.com",
    "address": "Str. Noua, Cluj-Napoca",
    "contactPerson": {"name": "Ion Pop", "email": "ion@brandnew.com"},
}


# ── List ──────────────────────────────────────────────────────────────────────

def test_list_companies(client):
    r = client.get("/companies")
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    assert len(r.json()) > 0


# ── Get single ────────────────────────────────────────────────────────────────

def test_get_existing_company(client):
    r = client.get("/companies/1")
    assert r.status_code == 200
    assert r.json()["id"] == 1


def test_get_missing_company_returns_404(client):
    r = client.get("/companies/9999")
    assert r.status_code == 404


# ── Create ────────────────────────────────────────────────────────────────────

def test_create_company_success(client):
    r = client.post("/companies", json=VALID_COMPANY)
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Brand New Corp"
    assert data["observations"] == []


def test_create_company_duplicate_name(client):
    r = client.post("/companies", json={**VALID_COMPANY, "name": "Acme Corporation"})
    assert r.status_code == 409


def test_create_company_invalid_email(client):
    r = client.post("/companies", json={**VALID_COMPANY, "email": "not-an-email"})
    assert r.status_code == 422


def test_create_company_invalid_phone(client):
    r = client.post("/companies", json={**VALID_COMPANY, "phone": "abc"})
    assert r.status_code == 422


def test_create_company_short_name(client):
    r = client.post("/companies", json={**VALID_COMPANY, "name": "X"})
    assert r.status_code == 422


def test_create_company_short_address(client):
    r = client.post("/companies", json={**VALID_COMPANY, "address": "Hi"})
    assert r.status_code == 422


# ── Update ────────────────────────────────────────────────────────────────────

def test_update_company_success(client):
    r = client.put("/companies/1", json={**VALID_COMPANY, "name": "Valley Education Updated"})
    assert r.status_code == 200
    assert r.json()["name"] == "Valley Education Updated"


def test_update_company_not_found(client):
    r = client.put("/companies/9999", json=VALID_COMPANY)
    assert r.status_code == 404


def test_update_company_duplicate_name(client):
    r = client.put("/companies/1", json={**VALID_COMPANY, "name": "Acme Corporation"})
    assert r.status_code == 409


def test_update_preserves_observations(client):
    client.post("/companies/1/observations", json={"text": "Keep me", "author": "Test"})
    client.put("/companies/1", json={**VALID_COMPANY, "name": "Valley Education"})
    obs = client.get("/companies/1").json()["observations"]
    assert any(o["text"] == "Keep me" for o in obs)


# ── Delete ────────────────────────────────────────────────────────────────────

def test_delete_company_success(client):
    created = client.post("/companies", json=VALID_COMPANY).json()
    r = client.delete(f"/companies/{created['id']}")
    assert r.status_code == 204
    assert client.get(f"/companies/{created['id']}").status_code == 404


def test_delete_company_not_found(client):
    r = client.delete("/companies/9999")
    assert r.status_code == 404


# ── Observations (1-to-many) ──────────────────────────────────────────────────

def test_add_observation_success(client):
    r = client.post("/companies/1/observations", json={"text": "Important note", "author": "Sarah"})
    assert r.status_code == 201
    data = r.json()
    assert data["text"] == "Important note"
    assert data["checked"] is False
    assert "id" in data
    assert "createdAt" in data


def test_add_observation_empty_text(client):
    r = client.post("/companies/1/observations", json={"text": "", "author": "Sarah"})
    assert r.status_code == 422


def test_add_observation_company_not_found(client):
    r = client.post("/companies/9999/observations", json={"text": "Note", "author": "Sarah"})
    assert r.status_code == 404


def test_toggle_observation(client):
    obs = client.post("/companies/1/observations", json={"text": "Toggle me", "author": "Test"}).json()
    obs_id = obs["id"]

    r = client.patch(f"/companies/1/observations/{obs_id}/toggle")
    assert r.status_code == 200
    assert r.json()["checked"] is True

    r = client.patch(f"/companies/1/observations/{obs_id}/toggle")
    assert r.json()["checked"] is False


def test_toggle_observation_not_found(client):
    r = client.patch("/companies/1/observations/9999/toggle")
    assert r.status_code == 404


def test_delete_observation_success(client):
    obs = client.post("/companies/1/observations", json={"text": "Delete me", "author": "Test"}).json()
    obs_id = obs["id"]

    r = client.delete(f"/companies/1/observations/{obs_id}")
    assert r.status_code == 204

    remaining = client.get("/companies/1").json()["observations"]
    assert all(o["id"] != obs_id for o in remaining)


def test_delete_observation_not_found(client):
    r = client.delete("/companies/1/observations/9999")
    assert r.status_code == 404
