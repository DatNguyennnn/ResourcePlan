from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.api import employees, projects, allocations, dashboard, import_excel, auth

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="HR Resource Management API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(projects.router)
app.include_router(allocations.router)
app.include_router(dashboard.router)
app.include_router(import_excel.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
