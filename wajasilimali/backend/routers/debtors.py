from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import List, Optional
from database import get_db
import models, schemas
from auth_utils import get_current_user
from tenant import require_business

router = APIRouter(prefix="/api/debtors", tags=["Debtors / Madeni"])


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


@router.get("/", response_model=List[schemas.DebtOut])
def list_debts(
    settled: bool = False,
    skip: int = 0,
    limit: int = 100,
    branch_id: Optional[int] = Query(None),
    x_branch_id: Optional[str] = Header(None, alias="X-Branch-Id"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    bid = require_business(current_user)
    br = _resolve_branch(branch_id, x_branch_id)

    query = (
        db.query(models.Debt)
        .options(
            joinedload(models.Debt.customer),
            joinedload(models.Debt.payments),
        )
        .outerjoin(models.Sale, models.Debt.sale_id == models.Sale.id)
        .filter(models.Debt.is_settled == settled, models.Debt.business_id == bid)
    )
    if br is not None:
        # deni la duka hili: branch_id kwenye debt AU sale
        query = query.filter(
            or_(
                models.Debt.branch_id == br,
                models.Sale.branch_id == br,
            )
        )
    query = query.order_by(models.Debt.created_at.desc())
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
    if debt.business_id != require_business(current_user):
        raise HTTPException(status_code=403, detail="Not your data")
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
        .options(joinedload(models.Debt.payments), joinedload(models.Debt.customer))
        .filter(models.Debt.id == debt_id)
        .first()
    )
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    if debt.business_id != require_business(current_user):
        raise HTTPException(status_code=403, detail="Not your data")
    if debt.is_settled:
        raise HTTPException(status_code=400, detail="Debt is already settled")
    if payment_in.amount > debt.remaining_amount + 0.001:
        raise HTTPException(
            status_code=400,
            detail=f"Payment exceeds remaining amount ({debt.remaining_amount})",
        )

    pay = models.DebtPayment(
        debt_id=debt.id,
        amount=payment_in.amount,
        payment_method=getattr(payment_in.payment_method, "value", payment_in.payment_method)
        if payment_in.payment_method
        else "cash",
        notes=payment_in.notes,
    )
    db.add(pay)
    debt.remaining_amount = max(0.0, debt.remaining_amount - payment_in.amount)
    if debt.remaining_amount <= 0.001:
        debt.remaining_amount = 0.0
        debt.is_settled = True
    db.commit()

    debt = (
        db.query(models.Debt)
        .options(
            joinedload(models.Debt.customer),
            joinedload(models.Debt.payments),
        )
        .filter(models.Debt.id == debt_id)
        .first()
    )
    return debt


@router.get("/customers/", response_model=List[schemas.CustomerOut])
def list_customers(
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    bid = require_business(current_user)
    return (
        db.query(models.Customer)
        .filter(models.Customer.business_id == bid)
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
    bid = require_business(current_user)
    customer = models.Customer(**customer_in.model_dump(), business_id=bid)
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer
