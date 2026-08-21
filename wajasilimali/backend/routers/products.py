from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models, schemas
from auth_utils import get_current_user
from tenant import require_business

router = APIRouter(prefix="/api/products", tags=["Products / Inventory"])


def _resolve_branch(
    branch_id: Optional[int] = None,
    x_branch_id: Optional[str] = None,
) -> Optional[int]:
    if branch_id is not None:
        return branch_id
    if x_branch_id is not None and str(x_branch_id).strip() != "":
        try:
            return int(x_branch_id)
        except ValueError:
            return None
    return None


@router.get("/", response_model=List[schemas.ProductOut])
def list_products(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    low_stock_only: bool = False,
    branch_id: Optional[int] = Query(None),
    x_branch_id: Optional[str] = Header(None, alias="X-Branch-Id"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    bid = require_business(current_user)
    query = db.query(models.Product).filter(
        models.Product.is_active == True,
        models.Product.business_id == bid,
    )
    br = _resolve_branch(branch_id, x_branch_id)
    if br is not None:
        query = query.filter(models.Product.branch_id == br)
    if search:
        query = query.filter(
            models.Product.name.ilike(f"%{search}%")
            | models.Product.sku.ilike(f"%{search}%")
            | models.Product.barcode.ilike(f"%{search}%")
        )
    if low_stock_only:
        query = query.filter(models.Product.quantity <= models.Product.low_stock_threshold)
    return query.order_by(models.Product.name).offset(skip).limit(limit).all()


@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    bid = require_business(current_user)
    product = (
        db.query(models.Product)
        .filter(
            models.Product.id == product_id,
            models.Product.business_id == bid,
        )
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/", response_model=schemas.ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: schemas.ProductCreate,
    branch_id: Optional[int] = Query(None),
    x_branch_id: Optional[str] = Header(None, alias="X-Branch-Id"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    bid = require_business(current_user)
    data = product_in.model_dump()
    br = data.get("branch_id")
    if br is None:
        br = _resolve_branch(branch_id, x_branch_id)
    data["branch_id"] = br
    if data["branch_id"] is None:
        raise HTTPException(
            status_code=400,
            detail="Chagua duka kwanza kabla ya kuongeza bidhaa",
        )
    if data.get("sku"):
        existing = (
            db.query(models.Product)
            .filter(
                models.Product.business_id == bid,
                models.Product.sku == data["sku"],
            )
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="SKU already exists")
    if data.get("barcode"):
        existing = (
            db.query(models.Product)
            .filter(
                models.Product.business_id == bid,
                models.Product.barcode == data["barcode"],
            )
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Barcode already exists")

    product = models.Product(**data, business_id=bid)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: int,
    product_in: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    bid = require_business(current_user)
    product = (
        db.query(models.Product)
        .filter(
            models.Product.id == product_id,
            models.Product.business_id == bid,
        )
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for field, value in product_in.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    bid = require_business(current_user)
    product = (
        db.query(models.Product)
        .filter(
            models.Product.id == product_id,
            models.Product.business_id == bid,
        )
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_active = False
    db.commit()
    return None


@router.patch("/{product_id}/adjust-stock", response_model=schemas.ProductOut)
def adjust_stock(
    product_id: int,
    quantity_change: int = Query(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    bid = require_business(current_user)
    product = (
        db.query(models.Product)
        .filter(
            models.Product.id == product_id,
            models.Product.business_id == bid,
        )
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    new_qty = product.quantity + quantity_change
    if new_qty < 0:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    product.quantity = new_qty
    db.commit()
    db.refresh(product)
    return product
