from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models, schemas
from auth_utils import get_current_user

router = APIRouter(prefix="/api/products", tags=["Products / Inventory"])


@router.get("/", response_model=List[schemas.ProductOut])
def list_products(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    low_stock_only: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Product).filter(models.Product.is_active == True)
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
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/", response_model=schemas.ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if product_in.sku:
        existing = db.query(models.Product).filter(models.Product.sku == product_in.sku).first()
        if existing:
            raise HTTPException(status_code=400, detail="SKU already exists")
    if product_in.barcode:
        existing = db.query(models.Product).filter(models.Product.barcode == product_in.barcode).first()
        if existing:
            raise HTTPException(status_code=400, detail="Barcode already exists")

    product = models.Product(**product_in.model_dump())
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
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = product_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
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
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_active = False  # soft delete
    db.commit()
    return None


@router.patch("/{product_id}/adjust-stock", response_model=schemas.ProductOut)
def adjust_stock(
    product_id: int,
    quantity_change: int = Query(..., description="Positive to add, negative to subtract"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    new_qty = product.quantity + quantity_change
    if new_qty < 0:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    product.quantity = new_qty
    db.commit()
    db.refresh(product)
    return product
