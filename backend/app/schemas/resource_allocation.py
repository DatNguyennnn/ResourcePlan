from pydantic import BaseModel
from datetime import date, datetime


class AllocationBase(BaseModel):
    employee_id: int
    project_id: int
    week_start: date
    allocation_percentage: float


class AllocationCreate(AllocationBase):
    pass


class AllocationUpdate(BaseModel):
    allocation_percentage: float


class AllocationResponse(AllocationBase):
    id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class AllocationBulkCreate(BaseModel):
    employee_id: int
    project_id: int
    allocations: dict[str, float]  # week_start_str -> percentage
