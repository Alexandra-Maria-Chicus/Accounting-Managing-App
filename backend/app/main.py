import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.routers import records, companies, generator, ws_router, auth, chat, logs
from app.routers.graphql_router import graphql_app
from app.db.session import SessionLocal
from app.db.models.auth_token import AuthToken  # noqa: F401 — registers model with Base
from app.services import log_service
from app.services.auth_service import decode_token
from jose import JWTError  # noqa: F401

# Directory where the built React app lives (set by render.yaml / docker-compose).
# Falls back to a sensible Render absolute path so it works without configuration.
FRONTEND_DIST = os.getenv("FRONTEND_DIST", "/opt/render/project/src/backend/frontend_dist")

app = FastAPI(title="Complet Cont API", version="1.0.0")

_FRONTEND = os.getenv("FRONTEND_URL", "https://localhost:5173")
_FRONTEND_HTTP = _FRONTEND.replace("https://", "http://")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        _FRONTEND,
        _FRONTEND_HTTP,
        "https://localhost:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API routers (registered first — they always win over the static catch-all) ─

app.include_router(records.router)
app.include_router(companies.router)
app.include_router(generator.router)
app.include_router(ws_router.router)
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(logs.router)
app.include_router(graphql_app, prefix="/graphql")


@app.get("/", include_in_schema=False)
def root():
    idx = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.isfile(idx):
        return FileResponse(idx)
    return {"message": "Complet Cont API", "docs": "/docs", "graphql": "/graphql"}


@app.middleware("http")
async def log_middleware(request: Request, call_next):
    response = await call_next(request)

    if request.url.path.startswith("/auth"):
        return response

    if request.url.path.startswith("/logs"):
        return response

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return response

    try:
        payload = decode_token(auth_header[7:])
        user_email = payload["sub"]
        user_role = payload.get("role", "unknown")
    except Exception:
        return response

    if request.method in ("POST", "PUT", "DELETE", "PATCH"):
        try:
            db = SessionLocal()
            log_service.log_action(
                db,
                user_email=user_email,
                role=user_role,
                action=request.method,
                details=str(request.url.path),
                ip_address=request.client.host,
            )
            db.close()
        except Exception:
            pass

    return response


# ── Static frontend + SPA fallback ───────────────────────────────────────────
# Mounted LAST so every API / WebSocket route registered above takes precedence.
# Route resolution order (Starlette iterates app.router.routes in insertion order):
#   1. All include_router() routes  → /auth/*, /records, /companies, /ws, etc.
#   2. The explicit GET /           → serves index.html or the JSON health msg
#   3. The Mount("/", StaticFiles)  → serves JS/CSS/images from the Vite build
#      Unknown paths inside the mount get a 404 which the handler below converts
#      to index.html so client-side routes work on refresh.

if os.path.isdir(FRONTEND_DIST):
    _API_PREFIXES = (
        "/auth", "/records", "/companies", "/generator",
        "/logs", "/graphql", "/ws", "/docs", "/openapi.json", "/redoc",
    )
    _index_html = os.path.join(FRONTEND_DIST, "index.html")

    @app.exception_handler(StarletteHTTPException)
    async def _spa_404(request: Request, exc: StarletteHTTPException):
        # Return index.html for unknown paths so SPA client-side routing works.
        # Leave real API 404s (e.g. "company not found") as JSON.
        if exc.status_code == 404 and not any(
            request.url.path.startswith(p) for p in _API_PREFIXES
        ):
            if os.path.isfile(_index_html):
                return FileResponse(_index_html)
        return JSONResponse({"detail": exc.detail}, status_code=exc.status_code)

    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
