from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.routers import records, companies, generator, ws_router, auth, chat, logs
from app.routers.graphql_router import graphql_app
from app.db.session import SessionLocal
from app.services import log_service

app = FastAPI(title="Complet Cont API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    #allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_origins=["*"],
    allow_credentials= False,#True,
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
        
    user_email = request.headers.get("X-User-Email", "anonymous")
    
    # only log if we know who the user is
    if user_email == "anonymous":
        return response
    
    if request.method in ("POST", "PUT", "DELETE", "PATCH"):
        try:
            db = SessionLocal()
            user_role = request.headers.get("X-User-Role", "unknown")
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