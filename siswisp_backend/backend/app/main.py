from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base, engine
from app.api.routes.auth import router as auth_router
from app.api.routes.clients import router as clients_router
from app.api.routes.payments import router as payments_router, dashboard_router
from app.api.routes.plans import router as plans_router

# Crear tablas en BD (en producción usa Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SISWISP API",
    description="Sistema de Administración para ISP / WISP",
    version="1.0.0",
)

# CORS — permite peticiones desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost", "127.0.0.1", "*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    max_age=86400,
)

# Registrar rutas
app.include_router(auth_router)
app.include_router(clients_router)
app.include_router(payments_router)
app.include_router(dashboard_router)
app.include_router(plans_router)


@app.get("/")
def root():
    return {"app": "SISWISP", "status": "running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
