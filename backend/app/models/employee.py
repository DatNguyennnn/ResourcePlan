from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), unique=True, nullable=False, index=True)
    full_name = Column(String(200), nullable=False)
    department = Column(String(200), nullable=False)
    level = Column(String(50), nullable=False)  # Senior, Experienced, Assessed
    status = Column(String(50), nullable=False)  # Chính thức, Học việc, Thử việc
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    allocations = relationship("ResourceAllocation", back_populates="employee", cascade="all, delete-orphan")
