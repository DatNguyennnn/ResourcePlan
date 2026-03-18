from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_
from datetime import date, timedelta
from typing import List
from app.database import get_db
from app.models.employee import Employee
from app.models.project import Project
from app.models.resource_allocation import ResourceAllocation

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def parse_multi(value: str | None) -> list[str]:
    """Parse comma-separated filter value into list."""
    if not value:
        return []
    return [v.strip() for v in value.split(",") if v.strip()]


@router.get("/filter-options")
def get_filter_options(db: Session = Depends(get_db)):
    """Get available values for all filter dropdowns."""
    departments = [r[0] for r in db.query(Employee.department).distinct().order_by(Employee.department).all() if r[0]]
    levels = [r[0] for r in db.query(Employee.level).distinct().order_by(Employee.level).all() if r[0]]
    project_statuses = [r[0] for r in db.query(Project.status).distinct().order_by(Project.status).all() if r[0]]
    pms = [r[0] for r in db.query(Project.pm).distinct().order_by(Project.pm).all() if r[0]]
    project_names = [r[0] for r in db.query(Project.project_name).distinct().order_by(Project.project_name).all() if r[0]]

    return {
        "departments": departments,
        "levels": levels,
        "project_statuses": project_statuses,
        "pms": pms,
        "project_names": project_names,
    }


@router.get("/summary")
def get_dashboard_summary(
    week_from: date | None = None,
    week_to: date | None = None,
    department: str | None = None,
    level: str | None = None,
    project_status: str | None = None,
    pm: str | None = None,
    project_name: str | None = None,
    db: Session = Depends(get_db),
):
    departments = parse_multi(department)
    levels = parse_multi(level)
    project_statuses = parse_multi(project_status)
    pms = parse_multi(pm)
    project_names = parse_multi(project_name)

    # Total employees
    emp_query = db.query(Employee)
    if departments:
        emp_query = emp_query.filter(Employee.department.in_(departments))
    if levels:
        emp_query = emp_query.filter(Employee.level.in_(levels))
    total_employees = emp_query.count()

    # Active projects (not Đóng)
    proj_query = db.query(Project).filter(Project.status != "Đóng")
    if project_statuses:
        proj_query = db.query(Project).filter(Project.status.in_(project_statuses))
    if pms:
        proj_query = proj_query.filter(Project.pm.in_(pms))
    if project_names:
        proj_query = proj_query.filter(Project.project_name.in_(project_names))
    active_projects = proj_query.count()

    # Employee level distribution
    level_dist = (
        db.query(Employee.level, func.count(Employee.id))
        .group_by(Employee.level)
    )
    if departments:
        level_dist = level_dist.filter(Employee.department.in_(departments))
    if levels:
        level_dist = level_dist.filter(Employee.level.in_(levels))
    level_distribution = {row[0]: row[1] for row in level_dist.all()}

    # Department distribution
    dept_dist = (
        db.query(Employee.department, func.count(Employee.id))
        .group_by(Employee.department)
    )
    if departments:
        dept_dist = dept_dist.filter(Employee.department.in_(departments))
    if levels:
        dept_dist = dept_dist.filter(Employee.level.in_(levels))
    department_distribution = {row[0]: row[1] for row in dept_dist.all()}

    # Employee status distribution
    status_dist = (
        db.query(Employee.status, func.count(Employee.id))
        .group_by(Employee.status)
    )
    if departments:
        status_dist = status_dist.filter(Employee.department.in_(departments))
    if levels:
        status_dist = status_dist.filter(Employee.level.in_(levels))
    employee_status_distribution = {row[0]: row[1] for row in status_dist.all()}

    # Project status distribution
    proj_status_dist = (
        db.query(Project.status, func.count(Project.id))
        .group_by(Project.status)
    )
    if project_statuses:
        proj_status_dist = proj_status_dist.filter(Project.status.in_(project_statuses))
    if pms:
        proj_status_dist = proj_status_dist.filter(Project.pm.in_(pms))
    if project_names:
        proj_status_dist = proj_status_dist.filter(Project.project_name.in_(project_names))
    project_status_distribution = {row[0]: row[1] for row in proj_status_dist.all()}

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
        .join(Project, ResourceAllocation.project_id == Project.id)
        .filter(ResourceAllocation.week_start >= week_from)
        .filter(ResourceAllocation.week_start <= week_to)
    )
    if departments:
        weekly_util = weekly_util.filter(Employee.department.in_(departments))
    if levels:
        weekly_util = weekly_util.filter(Employee.level.in_(levels))
    if project_statuses:
        weekly_util = weekly_util.filter(Project.status.in_(project_statuses))
    if pms:
        weekly_util = weekly_util.filter(Project.pm.in_(pms))
    if project_names:
        weekly_util = weekly_util.filter(Project.project_name.in_(project_names))
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
    level: str | None = None,
    project_status: str | None = None,
    pm: str | None = None,
    project_name: str | None = None,
    employee_name: str | None = None,
    db: Session = Depends(get_db),
):
    """Returns the resource allocation table (employee x week with total allocation)."""
    departments = parse_multi(department)
    levels = parse_multi(level)
    project_statuses = parse_multi(project_status)
    pms = parse_multi(pm)
    project_names = parse_multi(project_name)

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
    if departments:
        query = query.filter(Employee.department.in_(departments))
    if levels:
        query = query.filter(Employee.level.in_(levels))
    if project_statuses:
        query = query.filter(Project.status.in_(project_statuses))
    if pms:
        query = query.filter(Project.pm.in_(pms))
    if project_names:
        query = query.filter(Project.project_name.in_(project_names))
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


@router.get("/chatbot-context")
def get_chatbot_context(
    db: Session = Depends(get_db),
):
    """Returns compact allocation data for all employees with project details, optimized for chatbot."""
    today = date.today()
    week_from = date(today.year, 1, 1)
    week_to = date(today.year, 12, 31)

    allocs = (
        db.query(
            Employee.id.label("emp_id"),
            Employee.full_name,
            Employee.department,
            Project.project_name,
            Project.project_code,
            ResourceAllocation.week_start,
            ResourceAllocation.allocation_percentage,
        )
        .join(Employee, ResourceAllocation.employee_id == Employee.id)
        .join(Project, ResourceAllocation.project_id == Project.id)
        .filter(ResourceAllocation.week_start >= week_from)
        .filter(ResourceAllocation.week_start <= week_to)
        .filter(ResourceAllocation.allocation_percentage > 0)
        .order_by(Employee.full_name, Project.project_name, ResourceAllocation.week_start)
        .all()
    )

    # Build compact structure: employee -> projects -> weeks
    emp_map = {}
    for row in allocs:
        if row.emp_id not in emp_map:
            emp_map[row.emp_id] = {
                "name": row.full_name,
                "department": row.department,
                "projects": {},
            }
        proj_key = row.project_code
        if proj_key not in emp_map[row.emp_id]["projects"]:
            emp_map[row.emp_id]["projects"][proj_key] = {
                "name": row.project_name,
                "weeks": {},
            }
        week_key = row.week_start.isoformat()
        emp_map[row.emp_id]["projects"][proj_key]["weeks"][week_key] = round(row.allocation_percentage * 100)

    # Convert to list format
    result = []
    for emp_id, emp in emp_map.items():
        projects = []
        for code, proj in emp["projects"].items():
            # Compact: only include week range and avg %
            weeks = proj["weeks"]
            if weeks:
                avg_pct = sum(weeks.values()) / len(weeks)
                week_dates = sorted(weeks.keys())
                projects.append({
                    "code": code,
                    "name": proj["name"],
                    "avg_pct": round(avg_pct),
                    "weeks_count": len(weeks),
                    "from": week_dates[0],
                    "to": week_dates[-1],
                    "current_weeks": {k: v for k, v in weeks.items() if k >= today.isoformat()},
                })
        result.append({
            "name": emp["name"],
            "department": emp["department"],
            "projects": projects,
        })

    return result


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
