"""
Comprehensive tests for POST /auth/login, POST /auth/register, GET /auth/me.
Uses raw_client (no auth override) so the real JWT flow is exercised.
"""

STAFF_CODE = "STAFF-2026"   # matches STAFF_REGISTRATION_CODE in .env
FIRM_CODE  = "VALLEY-2026"  # matches registration_code seeded in conftest

EMPLOYEE_PAYLOAD = {
    "name": "New Employee",
    "email": "employee@example.com",
    "password": "pass123",
    "role": "employee",
    "staffCode": STAFF_CODE,
}

CLIENT_PAYLOAD = {
    "name": "New Client",
    "email": "client@example.com",
    "password": "pass123",
    "role": "client",
    "firmCode": FIRM_CODE,
}


# ── /auth/login ───────────────────────────────────────────────────────────────

def test_login_success(raw_client):
    r = raw_client.post("/auth/login", json={"email": "admin@test.com", "password": "admin123"})
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["email"] == "admin@test.com"
    assert data["role"] == "admin"


def test_login_wrong_password(raw_client):
    r = raw_client.post("/auth/login", json={"email": "admin@test.com", "password": "wrongpassword"})
    assert r.status_code == 401


def test_login_unknown_email(raw_client):
    r = raw_client.post("/auth/login", json={"email": "nobody@example.com", "password": "anything"})
    assert r.status_code == 401


def test_login_empty_password(raw_client):
    r = raw_client.post("/auth/login", json={"email": "admin@test.com", "password": ""})
    assert r.status_code == 401


# ── /auth/register — employee ─────────────────────────────────────────────────

def test_register_employee_success(raw_client):
    r = raw_client.post("/auth/register", json=EMPLOYEE_PAYLOAD)
    assert r.status_code == 201
    data = r.json()
    assert "access_token" in data
    assert data["role"] == "employee"
    assert data["email"] == EMPLOYEE_PAYLOAD["email"]
    assert data["companyName"] is None


def test_register_employee_wrong_staff_code(raw_client):
    r = raw_client.post("/auth/register", json={**EMPLOYEE_PAYLOAD, "staffCode": "WRONG-CODE"})
    assert r.status_code == 403


def test_register_employee_missing_staff_code(raw_client):
    payload = {k: v for k, v in EMPLOYEE_PAYLOAD.items() if k != "staffCode"}
    r = raw_client.post("/auth/register", json=payload)
    assert r.status_code == 400


def test_register_employee_token_is_valid(raw_client):
    """Token returned on register should work for /auth/me."""
    r = raw_client.post("/auth/register", json=EMPLOYEE_PAYLOAD)
    token = r.json()["access_token"]
    me = raw_client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["role"] == "employee"


# ── /auth/register — client ───────────────────────────────────────────────────

def test_register_client_success(raw_client):
    r = raw_client.post("/auth/register", json=CLIENT_PAYLOAD)
    assert r.status_code == 201
    data = r.json()
    assert "access_token" in data
    assert data["role"] == "client"
    assert data["companyName"] == "Valley Education"


def test_register_client_wrong_firm_code(raw_client):
    r = raw_client.post("/auth/register", json={**CLIENT_PAYLOAD, "firmCode": "NOTEXIST-9999"})
    assert r.status_code == 404


def test_register_client_missing_firm_code(raw_client):
    payload = {k: v for k, v in CLIENT_PAYLOAD.items() if k != "firmCode"}
    r = raw_client.post("/auth/register", json=payload)
    assert r.status_code == 400


# ── /auth/register — shared validations ──────────────────────────────────────

def test_register_duplicate_email(raw_client):
    """admin@test.com is already seeded — must return 409."""
    r = raw_client.post("/auth/register", json={**EMPLOYEE_PAYLOAD, "email": "admin@test.com"})
    assert r.status_code == 409


def test_register_invalid_role(raw_client):
    r = raw_client.post("/auth/register", json={**EMPLOYEE_PAYLOAD, "role": "superadmin"})
    assert r.status_code == 400


def test_register_short_password(raw_client):
    r = raw_client.post("/auth/register", json={**EMPLOYEE_PAYLOAD, "password": "123"})
    assert r.status_code == 400


def test_register_second_user_with_same_firm_code(raw_client):
    """Two clients can register with the same firm code (same company)."""
    r1 = raw_client.post("/auth/register", json=CLIENT_PAYLOAD)
    r2 = raw_client.post("/auth/register", json={**CLIENT_PAYLOAD, "email": "client2@example.com"})
    assert r1.status_code == 201
    assert r2.status_code == 201


# ── /auth/me ──────────────────────────────────────────────────────────────────

def test_me_returns_current_user(raw_client):
    login = raw_client.post("/auth/login", json={"email": "admin@test.com", "password": "admin123"})
    token = login.json()["access_token"]

    r = raw_client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["role"] == "admin"
    assert data["sub"] == "admin@test.com"


def test_me_without_token_returns_401(raw_client):
    r = raw_client.get("/auth/me")
    assert r.status_code == 401


def test_me_with_invalid_token_returns_401(raw_client):
    r = raw_client.get("/auth/me", headers={"Authorization": "Bearer this.is.not.valid"})
    assert r.status_code == 401


def test_me_after_register_employee(raw_client):
    reg = raw_client.post("/auth/register", json=EMPLOYEE_PAYLOAD)
    token = reg.json()["access_token"]
    me = raw_client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["role"] == "employee"


def test_me_after_register_client(raw_client):
    reg = raw_client.post("/auth/register", json=CLIENT_PAYLOAD)
    token = reg.json()["access_token"]
    me = raw_client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["role"] == "client"
    assert me.json()["company"] == "Valley Education"
