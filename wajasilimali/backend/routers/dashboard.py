from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_
from datetime import date, datetime
from database import get_db
import models, schemas
from auth_utils import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    today = date.today()

    # Today's sales
    today_sales_q = (
        db.query(func.coalesce(func.sum(models.Sale.total), 0.0))
        .filter(func.date(models.Sale.created_at) == today)
        .scalar()
    )
    today_count = (
        db.query(func.count(models.Sale.id))
        .filter(func.date(models.Sale.created_at) == today)
        .scalar()
    )

    # Net profit today (sales - cost of goods)
    today_sales = (
        db.query(models.Sale)
        .options(joinedload(models.Sale.items))
        .filter(func.date(models.Sale.created_at) == today)
        .all()
    )
    cost_of_goods = 0.0
    for sale in today_sales:
        for item in sale.items:
            cost_of_goods += item.cost_price * item.quantity
    net_profit_today = float(today_sales_q or 0) - cost_of_goods

    # Products
    total_products = db.query(func.count(models.Product.id)).filter(models.Product.is_active == True).scalar()
    low_stock = (
        db.query(models.Product)
        .filter(
            models.Product.is_active == True,
            models.Product.quantity <= models.Product.low_stock_threshold,
        )
        .all()
    )

    # Debts
    total_debts = (
        db.query(func.coalesce(func.sum(models.Debt.remaining_amount), 0.0))
        .filter(models.Debt.is_settled == False)
        .scalar()
    )
    unpaid_count = (
        db.query(func.count(models.Debt.id))
        .filter(models.Debt.is_settled == False)
        .scalar()
    )

    # Top products (by quantity sold - last 30 days approx all)
    top_q = (
        db.query(
            models.Product.name,
            func.sum(models.SaleItem.quantity).label("qty_sold"),
            func.sum(models.SaleItem.total).label("revenue"),
        )
        .join(models.SaleItem, models.SaleItem.product_id == models.Product.id)
        .group_by(models.Product.id, models.Product.name)
        .order_by(func.sum(models.SaleItem.quantity).desc())
        .limit(5)
        .all()
    )
    top_products = [
        {"name": r[0], "qty_sold": int(r[1] or 0), "revenue": float(r[2] or 0)}
        for r in top_q
    ]

    # Recent sales
    recent = (
        db.query(models.Sale)
        .options(
            joinedload(models.Sale.items).joinedload(models.SaleItem.product),
            joinedload(models.Sale.customer),
        )
        .order_by(models.Sale.created_at.desc())
        .limit(5)
        .all()
    )

    return schemas.DashboardStats(
        today_sales=float(today_sales_q or 0),
        today_transactions=int(today_count or 0),
        total_products=int(total_products or 0),
        low_stock_count=len(low_stock),
        total_debts=float(total_debts or 0),
        unpaid_debts_count=int(unpaid_count or 0),
        net_profit_today=net_profit_today,
        top_products=top_products,
        recent_sales=recent,
        low_stock_products=low_stock,
    )
