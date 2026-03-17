from pydantic import BaseModel
from datetime import datetime


class ProjectBase(BaseModel):
    project_code: str
    project_name: str
    description: str | None = None
    pm: str | None = None
    status: str


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    project_name: str | None = None
    description: str | None = None
    pm: str | None = None
    status: str | None = None


class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True
