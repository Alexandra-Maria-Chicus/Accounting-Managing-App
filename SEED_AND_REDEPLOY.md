# Seed + Redeploy — Complet Cont on Render

## Admin credentials (created by the seed script)

| Field       | Value                         |
|-------------|-------------------------------|
| Email       | maria.alex1106@gmail.com      |
| Password    | admin123                      |
| Staff code  | STAFF-2026 (for employee reg) |

---

## Step 1 — Redeploy (push the code first)

The employee registration field is now prefilled with STAFF-2026, so the UI must
rebuild before the seed is useful.

```bash
git add backend/seed_full.py my-complet-cont/src/RegisterPage.jsx SEED_AND_REDEPLOY.md
git commit -m "Add seed_full script and prefill staff code"
git push origin main
```

Render auto-deploys on push (Blueprint is connected to main).
Watch **Render dashboard → completcont → Logs** until "Deploy live".

---

## Step 2 — Run the seed script against Render

### OPTION A — Render Shell (recommended, no local setup)

1. Render dashboard → `completcont` web service → **Shell** tab.
2. In the shell:
   ```sh
   cd backend
   python seed_full.py
   ```
3. Read the printed `ADMIN LOGIN CREATED` block to confirm.
   `DATABASE_URL` is already set in that environment — no extra config needed.

### OPTION B — From your laptop (pointing at Render's Postgres)

1. Render dashboard → `completcont-db` → copy the **External Database URL**.
2. In a VS Code terminal inside the repo:
   ```bash
   cd backend
   pip install -r requirements.txt   # once
   ```
3. Set the env var and run:

   **PowerShell:**
   ```powershell
   $env:DATABASE_URL="<the External Database URL>"
   python seed_full.py
   ```

   **macOS / Linux / Git Bash:**
   ```bash
   DATABASE_URL="<the External Database URL>" python seed_full.py
   ```
4. Read the printed `ADMIN LOGIN CREATED` block.

**Recommendation:** Use Option A — no local Python/DB setup needed.

---

## Step 3 — First login

1. Open **https://completcont.onrender.com** (or your Render URL).
2. Log in with `maria.alex1106@gmail.com` / `admin123`.
3. The admin account owns the **Complet Cont** organization (staff code `STAFF-2026`).
4. To add employees: share the staff code. Employees choose "Employee" on the
   Register page — the code is already prefilled with STAFF-2026.
5. To add clients: go to Companies, set (or verify) a registration code for each
   company, then share that code with the client.

---

## Notes

- **Idempotent:** running `seed_full.py` more than once is safe — it checks before
  inserting and updates the admin password/org if the user already exists.
- **Old seed.py** is untouched; it does not set `organization_id` so do not use it.
- **Clients/employees** created by the seed log in normally via the app UI.
  The 2FA email link is sent on every login after the first — make sure
  `MAILTRAP_*` env vars are set in Render, or check logs for the console link.
