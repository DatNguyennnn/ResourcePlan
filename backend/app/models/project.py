from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    project_code = Column(String(100), unique=True, nullable=False, index=True)
    project_name = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    pm = Column(String(100), nullable=True)
    status = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    allocations = relationship("ResourceAllocation", back_populates="project", cascade="all, delete-orphan")
