from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime
from app.database import get_db
from app.models.resource_allocation import ResourceAllocation
from app.models.employee import Employee
from app.models.project import Project
from app.models.user import User
from app.schemas.resource_allocation import AllocationCreate, AllocationUpdate, AllocationResponse, AllocationBulkCreate
from app.auth import require_admin

router = APIRouter(prefix="/api/allocations", tags=["allocations"])


def check_overload(db: Session, employee_id: int, week_start: date, exclude_alloc_id: int | None = None):
    """Check if employee total allocation > 100% for a given week. Returns warning dict or None."""
    query = (
        db.query(func.sum(ResourceAllocation.allocation_percentage))
        .filter(ResourceAllocation.employee_id == employee_id, ResourceAllocation.week_start == week_start)
    )
    if exclude_alloc_id:
        query = query.filter(ResourceAllocation.id != exclude_alloc_id)
    current_total = query.scalar() or 0.0
    return current_total


@router.get("/", response_model=list[AllocationResponse])
def list_allocations(
    employee_id: int | None = None,
    project_id: int | None = None,
    week_from: date | None = None,
    week_to: date | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(ResourceAllocation)
    if employee_id:
        query = query.filter(ResourceAllocation.employee_id == employee_id)
    if project_id:
        query = query.filter(ResourceAllocation.project_id == project_id)
    if week_from:
        query = query.filter(ResourceAllocation.week_start >= week_from)
    if week_to:
        query = query.filter(ResourceAllocation.week_start <= week_to)
    return query.order_by(ResourceAllocation.week_start).all()


@router.get("/overload")
def get_overloaded_employees(
    week_from: date | None = None,
    week_to: date | None = None,
    db: Session = Depends(get_db),
):
    """Get employees with >100% allocation in any week."""
    if not week_from:
        week_from = date.today()
    if not week_to:
        week_to = week_from

    results = (
        db.query(
            Employee.id,
            Employee.full_name,
            Employee.department,
            ResourceAllocation.week_start,
            func.sum(ResourceAllocation.allocation_percentage).label("total"),
        )
        .join(Employee, ResourceAllocation.employee_id == Employee.id)
        .filter(ResourceAllocation.week_start >= week_from, ResourceAllocation.week_start <= week_to)
        .group_by(Employee.id, Employee.full_name, Employee.department, ResourceAllocation.week_start)
        .having(func.sum(ResourceAllocation.allocation_percentage) > 1.0)
        .order_by(Employee.full_name, ResourceAllocation.week_start)
        .all()
    )

    overloaded = []
    for r in results:
        # Get project breakdown for this employee+week
        projects = (
            db.query(Project.project_name, ResourceAllocation.allocation_percentage)
            .join(Project, ResourceAllocation.project_id == Project.id)
            .filter(ResourceAllocation.employee_id == r.id, ResourceAllocation.week_start == r.week_start)
            .all()
        )
        overloaded.append({
            "employee_id": r.id,
            "employee_name": r.full_name,
            "department": r.department,
            "week": r.week_start.isoformat(),
            "total_percentage": round(r.total, 2),
            "projects": [{"name": p.project_name, "percentage": p.allocation_percentage} for p in projects],
        })
    return overloaded


@router.post("/", status_code=201)
def create_allocation(data: AllocationCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    alloc = ResourceAllocation(**data.model_dump())
    db.add(alloc)
    db.commit()
    db.refresh(alloc)

    # Check overload after adding
    total = check_overload(db, data.employee_id, data.week_start)
    warning = None
    if total > 1.0:
        emp = db.query(Employee).filter(Employee.id == data.employee_id).first()
        warning = f"CANH BAO: {emp.full_name} dang bi qua tai tuan {data.week_start} - tong phan bo {total*100:.0f}%"

    return {
        "allocation": AllocationResponse.model_validate(alloc),
        "warning": warning,
    }


@router.post("/bulk", status_code=201)
def bulk_create_allocations(data: AllocationBulkCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    created = 0
    warnings = []
    for week_str, pct in data.allocations.items():
        week_date = datetime.strptime(week_str, "%Y-%m-%d").date()
        existing = db.query(ResourceAllocation).filter(
            ResourceAllocation.employee_id == data.employee_id,
            ResourceAllocation.project_id == data.project_id,
            ResourceAllocation.week_start == week_date,
        ).first()
        if existing:
            if pct <= 0:
                db.delete(existing)
            else:
                existing.allocation_percentage = pct
        else:
            if pct > 0:
                alloc = ResourceAllocation(
                    employee_id=data.employee_id,
                    project_id=data.project_id,
                    week_start=week_date,
                    allocation_percentage=pct,
                )
                db.add(alloc)
        created += 1
    db.commit()

    # Check overload for all affected weeks
    emp = db.query(Employee).filter(Employee.id == data.employee_id).first()
    for week_str in data.allocations:
        week_date = datetime.strptime(week_str, "%Y-%m-%d").date()
        total = check_overload(db, data.employee_id, week_date)
        if total > 1.0:
            warnings.append(f"Tuan {week_str}: {emp.full_name} qua tai {total*100:.0f}%")

    return {"created_or_updated": created, "warnings": warnings}


@router.put("/{allocation_id}")
def update_allocation(allocation_id: int, data: AllocationUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    alloc = db.query(ResourceAllocation).filter(ResourceAllocation.id == allocation_id).first()
    if not alloc:
        raise HTTPException(status_code=404, detail="Allocation not found")
    alloc.allocation_percentage = data.allocation_percentage
    db.commit()
    db.refresh(alloc)

    total = check_overload(db, alloc.employee_id, alloc.week_start)
    warning = None
    if total > 1.0:
        emp = db.query(Employee).filter(Employee.id == alloc.employee_id).first()
        warning = f"CANH BAO: {emp.full_name} qua tai tuan {alloc.week_start} - tong {total*100:.0f}%"

    return {"allocation": AllocationResponse.model_validate(alloc), "warning": warning}


@router.delete("/{allocation_id}", status_code=204)
def delete_allocation(allocation_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    alloc = db.query(ResourceAllocation).filter(ResourceAllocation.id == allocation_id).first()
    if not alloc:
        raise HTTPException(status_code=404, detail="Allocation not found")
    db.delete(alloc)
    db.commit()
