from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from auth_utils import (
    get_password_hash,
    authenticate_user,
    create_access_token,
    get_current_user,
    get_current_admin,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register = unda BIASHARA mpya + admin wa biashara hiyo."""
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    if user_in.phone:
        existing_phone = db.query(models.User).filter(models.User.phone == user_in.phone).first()
        if existing_phone:
            raise HTTPException(status_code=400, detail="Phone number already registered")

    # Unda biashara mpya
    business_name = user_in.business_name or f"Biashara ya {user_in.full_name}"
    business = models.Business(
        name=business_name,
        phone=user_in.phone,
    )
    db.add(business)
    db.flush()

    user = models.User(
        business_id=business.id,
        full_name=user_in.full_name,
        email=user_in.email,
        phone=user_in.phone,
        hashed_password=get_password_hash(user_in.password),
        role=models.UserRole.ADMIN.value,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return current_user


@router.get("/users", response_model=List[schemas.UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin),
):
    """Staff wa biashara yako. Super admin: wote."""
    q = db.query(models.User)
    if getattr(current_user, "is_superuser", False):
        pass  # all users
    elif current_user.business_id:
        q = q.filter(models.User.business_id == current_user.business_id)
    else:
        return []
    return q.order_by(models.User.created_at.desc()).all()


@router.post("/staff", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def create_staff(
    staff_in: schemas.StaffCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin),
):
    if not current_user.business_id:
        raise HTTPException(status_code=400, detail="No business linked")
    existing = db.query(models.User).filter(models.User.email == staff_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        business_id=current_user.business_id,
        full_name=staff_in.full_name,
        email=staff_in.email,
        phone=staff_in.phone,
        hashed_password=get_password_hash(staff_in.password),
        role=models.UserRole.STAFF.value,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/toggle-active", response_model=schemas.UserOut)
def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.business_id != current_user.business_id:
        raise HTTPException(status_code=403, detail="Not your business user")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user

@router.get("/businesses", response_model=List[schemas.BusinessOut])
def list_businesses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Super admin: maduka yote. Mwingine: biashara yake tu."""
    if getattr(current_user, "is_superuser", False):
        return db.query(models.Business).order_by(models.Business.created_at.desc()).all()
    if current_user.business_id:
        b = db.query(models.Business).filter(models.Business.id == current_user.business_id).first()
        return [b] if b else []
    return []


@router.get("/users/all", response_model=List[schemas.UserOut])
def list_all_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Super admin only — watumiaji wote kwenye platform."""
    if not getattr(current_user, "is_superuser", False):
        raise HTTPException(status_code=403, detail="Super admin only")
    return db.query(models.User).order_by(models.User.created_at.desc()).all()
