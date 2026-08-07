from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from database import get_db
import models, schemas
from auth_utils import get_current_user

router = APIRouter(prefix="/api/debtors", tags=["Debtors / Madeni"])


@router.get("/", response_model=List[schemas.DebtOut])
def list_debts(
    settled: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = (
        db.query(models.Debt)
        .options(
            joinedload(models.Debt.customer),
            joinedload(models.Debt.payments),
        )
        .filter(models.Debt.is_settled == settled)
        .order_by(models.Debt.created_at.desc())
    )
    return query.offset(skip).limit(limit).all()


@router.get("/{debt_id}", response_model=schemas.DebtOut)
def get_debt(
    debt_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    debt = (
        db.query(models.Debt)
        .options(
            joinedload(models.Debt.customer),
            joinedload(models.Debt.payments),
        )
        .filter(models.Debt.id == debt_id)
        .first()
    )
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    return debt


@router.post("/{debt_id}/payments", response_model=schemas.DebtOut)
def record_payment(
    debt_id: int,
    payment_in: schemas.DebtPaymentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    debt = (
        db.query(models.Debt)
        .options(joinedload(models.Debt.payments))
        .filter(models.Debt.id == debt_id)
        .first()
    )
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    if debt.is_settled:
        raise HTTPException(status_code=400, detail="Debt is already settled")
    if payment_in.amount > debt.remaining_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Payment exceeds remaining amount ({debt.remaining_amount})",
        )

    payment = models.DebtPayment(
        debt_id=debt.id,
        amount=payment_in.amount,
        payment_method=payment_in.payment_method.value,
        notes=payment_in.notes,
    )
    db.add(payment)

    debt.remaining_amount -= payment_in.amount
    if debt.remaining_amount <= 0:
        debt.remaining_amount = 0
        debt.is_settled = True

    db.commit()
    db.refresh(debt)

    debt = (
        db.query(models.Debt)
        .options(
            joinedload(models.Debt.customer),
            joinedload(models.Debt.payments),
        )
        .filter(models.Debt.id == debt.id)
        .first()
    )
    return debt


@router.get("/customers/", response_model=List[schemas.CustomerOut])
def list_customers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.Customer)
        .order_by(models.Customer.name)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("/customers/", response_model=schemas.CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(
    customer_in: schemas.CustomerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    customer = models.Customer(**customer_in.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer
