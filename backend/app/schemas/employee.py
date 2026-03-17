from pydantic import BaseModel
from datetime import datetime


class EmployeeBase(BaseModel):
    employee_id: str
    full_name: str
    department: str
    level: str
    status: str


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    full_name: str | None = None
    department: str | None = None
    level: str | None = None
    status: str | None = None


class EmployeeResponse(EmployeeBase):
    id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True
