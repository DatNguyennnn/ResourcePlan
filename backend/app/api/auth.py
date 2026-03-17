from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.auth import hash_password, verify_password, create_access_token, require_login, require_admin

router = APIRouter(prefix="/api/auth", tags=["auth"])


class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str = "employee"


class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


@router.post("/login", response_model=TokenResponse)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sai tai khoan hoac mat khau")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tai khoan bi khoa")

    token = create_access_token({"sub": user.username, "role": user.role})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(require_login)):
    return user


@router.post("/register", response_model=UserResponse, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Only admin can register new users."""
    existing = db.query(User).filter(User.username == data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username da ton tai")
    user = User(
        username=data.username,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/users", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return db.query(User).all()


@router.post("/seed-admin")
def seed_admin(db: Session = Depends(get_db)):
    """Create default admin if none exists. Only works when no admin exists."""
    existing = db.query(User).filter(User.role == "admin").first()
    if existing:
        return {"message": "Admin da ton tai", "username": existing.username}
    admin = User(
        username="admin",
        hashed_password=hash_password("admin123"),
        full_name="Administrator",
        role="admin",
    )
    db.add(admin)
    # Also create a demo employee user
    emp = User(
        username="employee",
        hashed_password=hash_password("employee123"),
        full_name="Nhan vien Demo",
        role="employee",
    )
    db.add(emp)
    db.commit()
    return {"message": "Tao admin va employee thanh cong", "admin": "admin/admin123", "employee": "employee/employee123"}
