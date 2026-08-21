from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List
from database import get_db
import models
from auth_utils import get_current_user
from tenant import require_business

router = APIRouter(prefix="/api/branches", tags=["Branches"])


class BranchCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    phone: Optional[str] = None
    address: Optional[str] = None


class BranchUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None


class BranchOut(BaseModel):
    id: int
    business_id: int
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True


@router.get("/", response_model=List[BranchOut])
def list_branches(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    bid = require_business(current_user)
    rows = (
        db.query(models.Branch)
        .filter(models.Branch.business_id == bid, models.Branch.is_active == True)
        .order_by(models.Branch.name)
        .all()
    )
    # Auto-create default branch if none
    if not rows:
        default = models.Branch(
            business_id=bid,
            name="Duka kuu",
            is_active=True,
        )
        db.add(default)
        db.commit()
        db.refresh(default)
        rows = [default]
    return rows


@router.post("/", response_model=BranchOut, status_code=status.HTTP_201_CREATED)
def create_branch(
    body: BranchCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    bid = require_business(current_user)
    if current_user.role != "admin" and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin only")
    b = models.Branch(
        business_id=bid,
        name=body.name.strip(),
        phone=body.phone,
        address=body.address,
        is_active=True,
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    return b


@router.put("/{branch_id}", response_model=BranchOut)
def update_branch(
    branch_id: int,
    body: BranchUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    bid = require_business(current_user)
    b = (
        db.query(models.Branch)
        .filter(models.Branch.id == branch_id, models.Branch.business_id == bid)
        .first()
    )
    if not b:
        raise HTTPException(status_code=404, detail="Branch not found")
    if body.name is not None:
        b.name = body.name.strip()
    if body.phone is not None:
        b.phone = body.phone
    if body.address is not None:
        b.address = body.address
    if body.is_active is not None:
        b.is_active = body.is_active
    db.commit()
    db.refresh(b)
    return b


@router.delete("/{branch_id}")
def delete_branch(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    bid = require_business(current_user)
    if current_user.role != "admin" and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin only")
    b = (
        db.query(models.Branch)
        .filter(models.Branch.id == branch_id, models.Branch.business_id == bid)
        .first()
    )
    if not b:
        raise HTTPException(status_code=404, detail="Branch not found")
    count = db.query(models.Branch).filter(models.Branch.business_id == bid, models.Branch.is_active == True).count()
    if count <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the only branch")
    b.is_active = False
    db.commit()
    return {"ok": True}
