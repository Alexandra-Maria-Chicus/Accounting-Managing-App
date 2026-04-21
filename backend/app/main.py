from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import records, companies, generator, ws_router
from app.routers.graphql_router import graphql_app

app = FastAPI(title="Complet Cont API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(records.router)
app.include_router(companies.router)
app.include_router(generator.router)
app.include_router(ws_router.router)
app.include_router(graphql_app, prefix="/graphql")


@app.get("/")
def root():
    return {"message": "Complet Cont API", "docs": "/docs", "graphql": "/graphql"}
