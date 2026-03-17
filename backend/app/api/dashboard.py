from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_
from datetime import date, timedelta
from app.database import get_db
from app.models.employee import Employee
from app.models.project import Project
from app.models.resource_allocation import ResourceAllocation

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_dashboard_summary(
    week_from: date | None = None,
    week_to: date | None = None,
    department: str | None = None,
    project_status: str | None = None,
    db: Session = Depends(get_db),
):
    # Total employees
    emp_query = db.query(Employee)
    if department:
        emp_query = emp_query.filter(Employee.department == department)
    total_employees = emp_query.count()

    # Active projects (not Đóng)
    proj_query = db.query(Project).filter(Project.status != "Đóng")
    if project_status:
        proj_query = db.query(Project).filter(Project.status == project_status)
    active_projects = proj_query.count()

    # Employee level distribution
    level_dist = (
        db.query(Employee.level, func.count(Employee.id))
        .group_by(Employee.level)
    )
    if department:
        level_dist = level_dist.filter(Employee.department == department)
    level_distribution = {row[0]: row[1] for row in level_dist.all()}

    # Department distribution
    dept_dist = (
        db.query(Employee.department, func.count(Employee.id))
        .group_by(Employee.department)
        .all()
    )
    department_distribution = {row[0]: row[1] for row in dept_dist}

    # Employee status distribution
    status_dist = (
        db.query(Employee.status, func.count(Employee.id))
        .group_by(Employee.status)
    )
    if department:
        status_dist = status_dist.filter(Employee.department == department)
    employee_status_distribution = {row[0]: row[1] for row in status_dist.all()}

    # Project status distribution
    proj_status_dist = (
        db.query(Project.status, func.count(Project.id))
        .group_by(Project.status)
        .all()
    )
    project_status_distribution = {row[0]: row[1] for row in proj_status_dist}

    # Weekly utilization data
    if not week_from:
        week_from = date.today() - timedelta(weeks=12)
    if not week_to:
        week_to = date.today() + timedelta(weeks=12)

    weekly_util = (
        db.query(
            ResourceAllocation.week_start,
            Employee.full_name,
            Employee.department,
            func.sum(ResourceAllocation.allocation_percentage).label("total_alloc"),
        )
        .join(Employee, ResourceAllocation.employee_id == Employee.id)
        .filter(ResourceAllocation.week_start >= week_from)
        .filter(ResourceAllocation.week_start <= week_to)
    )
    if department:
        weekly_util = weekly_util.filter(Employee.department == department)
    weekly_util = weekly_util.group_by(
        ResourceAllocation.week_start, Employee.full_name, Employee.department
    ).all()

    # Build utilization summary per week
    weeks_data = {}
    for row in weekly_util:
        week_key = row.week_start.isoformat()
        if week_key not in weeks_data:
            weeks_data[week_key] = {"total": 0, "over_100": 0, "under_60": 0, "employee_count": 0}
        weeks_data[week_key]["employee_count"] += 1
        weeks_data[week_key]["total"] += row.total_alloc
        if row.total_alloc > 1.0:
            weeks_data[week_key]["over_100"] += 1
        if row.total_alloc < 0.6:
            weeks_data[week_key]["under_60"] += 1

    # Calculate participation rate per week
    weekly_summary = []
    for week_key in sorted(weeks_data.keys()):
        d = weeks_data[week_key]
        rate = (d["total"] / d["employee_count"] * 100) if d["employee_count"] > 0 else 0
        weekly_summary.append({
            "week": week_key,
            "participation_rate": round(rate, 1),
            "over_100_count": d["over_100"],
            "under_60_count": d["under_60"],
            "employee_count": d["employee_count"],
        })

    # Overload / underload stats
    # >100%: count across all weeks in range
    # <60%: only count from today forward (current + future weeks)
    today = date.today()
    over_100_employees = set()
    under_60_employees = set()
    participating_employees = set()
    for row in weekly_util:
        if row.total_alloc > 0:
            participating_employees.add(row.full_name)
        if row.total_alloc > 1.0:
            over_100_employees.add(row.full_name)
        if row.total_alloc < 0.6 and row.week_start >= today:
            under_60_employees.add(row.full_name)

    over_100 = len(over_100_employees)
    under_60 = len(under_60_employees)
    participation_rate = 0
    if total_employees > 0:
        participation_rate = round(len(participating_employees) / total_employees * 100, 1)

    return {
        "total_employees": total_employees,
        "active_projects": active_projects,
        "participation_rate": participation_rate,
        "over_100_count": over_100,
        "under_60_count": under_60,
        "level_distribution": level_distribution,
        "department_distribution": department_distribution,
        "employee_status_distribution": employee_status_distribution,
        "project_status_distribution": project_status_distribution,
        "weekly_summary": weekly_summary,
    }


@router.get("/resource-table")
def get_resource_table(
    week_from: date | None = None,
    week_to: date | None = None,
    department: str | None = None,
    project_status: str | None = None,
    employee_name: str | None = None,
    db: Session = Depends(get_db),
):
    """Returns the resource allocation table (employee x week with total allocation)."""
    if not week_from:
        week_from = date(date.today().year, 1, 1)
    if not week_to:
        week_to = date(date.today().year, 12, 31)

    query = (
        db.query(
            Employee.id.label("emp_id"),
            Employee.full_name,
            Employee.department,
            ResourceAllocation.week_start,
            func.sum(ResourceAllocation.allocation_percentage).label("total_alloc"),
        )
        .join(Employee, ResourceAllocation.employee_id == Employee.id)
        .join(Project, ResourceAllocation.project_id == Project.id)
        .filter(ResourceAllocation.week_start >= week_from)
        .filter(ResourceAllocation.week_start <= week_to)
    )
    if department:
        query = query.filter(Employee.department == department)
    if project_status:
        query = query.filter(Project.status == project_status)
    if employee_name:
        query = query.filter(Employee.full_name.ilike(f"%{employee_name}%"))

    query = query.group_by(
        Employee.id, Employee.full_name, Employee.department, ResourceAllocation.week_start
    ).order_by(Employee.full_name, ResourceAllocation.week_start)

    rows = query.all()

    # Build the table structure - only include weeks with actual allocations > 0
    employees_map = {}
    weeks_set = set()
    for row in rows:
        if row.total_alloc <= 0:
            continue
        if row.emp_id not in employees_map:
            employees_map[row.emp_id] = {
                "id": row.emp_id,
                "name": row.full_name,
                "department": row.department,
                "weeks": {},
            }
        week_key = row.week_start.isoformat()
        employees_map[row.emp_id]["weeks"][week_key] = round(row.total_alloc, 2)
        weeks_set.add(week_key)

    # Remove weeks where no employee has allocation (sparse columns)
    active_weeks = set()
    for emp in employees_map.values():
        active_weeks.update(emp["weeks"].keys())

    return {
        "weeks": sorted(active_weeks),
        "employees": list(employees_map.values()),
    }


@router.get("/employee-detail/{employee_id}")
def get_employee_detail(
    employee_id: int,
    week_from: date | None = None,
    week_to: date | None = None,
    db: Session = Depends(get_db),
):
    """Returns detailed allocation per project for an employee."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        return {"error": "Employee not found"}

    if not week_from:
        week_from = date(date.today().year, 1, 1)
    if not week_to:
        week_to = date(date.today().year, 12, 31)

    allocs = (
        db.query(
            Project.id.label("proj_id"),
            Project.project_name,
            Project.project_code,
            ResourceAllocation.week_start,
            ResourceAllocation.allocation_percentage,
        )
        .join(Project, ResourceAllocation.project_id == Project.id)
        .filter(ResourceAllocation.employee_id == employee_id)
        .filter(ResourceAllocation.week_start >= week_from)
        .filter(ResourceAllocation.week_start <= week_to)
        .order_by(Project.project_name, ResourceAllocation.week_start)
        .all()
    )

    projects_map = {}
    weeks_set = set()
    for row in allocs:
        if row.allocation_percentage <= 0:
            continue
        if row.project_code not in projects_map:
            projects_map[row.project_code] = {
                "project_code": row.project_code,
                "project_name": row.project_name,
                "project_id": row.proj_id,
                "weeks": {},
            }
        week_key = row.week_start.isoformat()
        projects_map[row.project_code]["weeks"][week_key] = row.allocation_percentage
        weeks_set.add(week_key)

    return {
        "employee": {"id": emp.id, "name": emp.full_name, "department": emp.department},
        "weeks": sorted(weeks_set),
        "projects": list(projects_map.values()),
    }
