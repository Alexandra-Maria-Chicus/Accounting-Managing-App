from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.routers import records, companies, generator, ws_router, auth, chat, logs, analytics
from app.routers.graphql_router import graphql_app
from app.db.session import SessionLocal
from app.db.models.auth_token import AuthToken  # noqa: F401 — registers model with Base
from app.services import log_service
from app.services.auth_service import decode_token
from jose import JWTError

app = FastAPI(title="Complet Cont API", version="1.0.0")

import os as _os
_FRONTEND = _os.getenv("FRONTEND_URL", "https://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[_FRONTEND, "https://localhost:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(records.router)
app.include_router(companies.router)
app.include_router(generator.router)
app.include_router(ws_router.router)
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(logs.router)
app.include_router(analytics.router)
app.include_router(graphql_app, prefix="/graphql")


@app.get("/")
def root():
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