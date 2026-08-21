from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_
from datetime import date
from database import get_db
import models, schemas
from auth_utils import get_current_user
from tenant import require_business
from typing import Optional
from fastapi import Header, Query

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    branch_id: Optional[int] = Query(None),
    x_branch_id: Optional[str] = Header(None, alias="X-Branch-Id"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    bid = require_business(current_user)
    br = branch_id
    if br is None and x_branch_id:
        try:
            br = int(x_branch_id)
        except ValueError:
            br = None
    today = date.today()

    today_sales_q = (
        db.query(func.coalesce(func.sum(models.Sale.total), 0.0))
        .filter(func.date(models.Sale.created_at) == today, ((models.Sale.business_id == bid) if br is None else and_(models.Sale.business_id == bid, models.Sale.branch_id == br)))
        .scalar()
    )
    today_count = (
        db.query(func.count(models.Sale.id))
        .filter(func.date(models.Sale.created_at) == today, ((models.Sale.business_id == bid) if br is None else and_(models.Sale.business_id == bid, models.Sale.branch_id == br)))
        .scalar()
    )

    today_sales = (
        db.query(models.Sale)
        .options(joinedload(models.Sale.items))
        .filter(func.date(models.Sale.created_at) == today, ((models.Sale.business_id == bid) if br is None else and_(models.Sale.business_id == bid, models.Sale.branch_id == br)))
        .all()
    )
    cost_of_goods = 0.0
    for sale in today_sales:
        for item in sale.items:
            cost_of_goods += item.cost_price * item.quantity
    net_profit_today = float(today_sales_q or 0) - cost_of_goods

    products = (
        db.query(models.Product)
        .filter(models.Product.is_active == True, ((models.Product.business_id == bid) if br is None else and_(models.Product.business_id == bid, models.Product.branch_id == br)))
        .all()
    )
    total_products = len(products)

    # Idadi iliyouzwa kwa kila bidhaa
    sold_map = dict(
        db.query(
            models.SaleItem.product_id,
            func.coalesce(func.sum(models.SaleItem.quantity), 0),
        )
        .join(models.Sale, models.Sale.id == models.SaleItem.sale_id)
        .filter(((models.Sale.business_id == bid) if br is None else and_(models.Sale.business_id == bid, models.Sale.branch_id == br)))
        .group_by(models.SaleItem.product_id)
        .all()
    )

    # Stoki inayoisha: baki <= 30% ya (baki + iliyouzwa) AU <= low_stock_threshold
    low_stock = []
    for p in products:
        sold_qty = int(sold_map.get(p.id, 0) or 0)
        total_held = p.quantity + sold_qty  # kadiri ya jumla uliyomiliki
        if total_held <= 0:
            # hakuna mauzo wala stoki — ignore unless threshold
            if p.quantity <= (p.low_stock_threshold or 0):
                low_stock.append(p)
            continue
        remaining_pct = (p.quantity / total_held) * 100.0
        if remaining_pct <= 30.0 or p.quantity <= (p.low_stock_threshold or 0):
            low_stock.append(p)

    # Bidhaa zilizouzwa (taarifa ya muda mrefu)
    sold_products = []
    for p in products:
        sold_qty = int(sold_map.get(p.id, 0) or 0)
        if sold_qty > 0:
            sold_products.append(
                {
                    "id": p.id,
                    "name": p.name,
                    "sku": p.sku,
                    "quantity_remaining": p.quantity,
                    "quantity_sold": sold_qty,
                    "unit": p.unit,
                    "selling_price": p.selling_price,
                }
            )
    sold_products.sort(key=lambda x: x["quantity_sold"], reverse=True)

    total_debts = (
        db.query(func.coalesce(func.sum(models.Debt.remaining_amount), 0.0))
        .filter(models.Debt.is_settled == False, models.Debt.business_id == bid)
        .scalar()
    )
    # Idadi ya WATU wanaodaiwa (customers unique)
    unpaid_count = (
        db.query(func.count(func.distinct(models.Debt.customer_id)))
        .filter(
            models.Debt.is_settled == False,
            models.Debt.business_id == bid,
            models.Debt.customer_id.isnot(None),
        )
        .scalar()
    )
    # pia deni bila customer
    unpaid_no_customer = (
        db.query(func.count(models.Debt.id))
        .filter(
            models.Debt.is_settled == False,
            models.Debt.business_id == bid,
            models.Debt.customer_id.is_(None),
        )
        .scalar()
    )
    unpaid_count = int(unpaid_count or 0) + int(unpaid_no_customer or 0)

    top_q = (
        db.query(
            models.Product.name,
            func.sum(models.SaleItem.quantity).label("qty_sold"),
            func.sum(models.SaleItem.total).label("revenue"),
        )
        .join(models.SaleItem, models.SaleItem.product_id == models.Product.id)
        .join(models.Sale, models.Sale.id == models.SaleItem.sale_id)
        .filter(((models.Sale.business_id == bid) if br is None else and_(models.Sale.business_id == bid, models.Sale.branch_id == br)))
        .group_by(models.Product.id, models.Product.name)
        .order_by(func.sum(models.SaleItem.quantity).desc())
        .limit(5)
        .all()
    )
    top_products = [
        {"name": r[0], "qty_sold": int(r[1] or 0), "revenue": float(r[2] or 0)}
        for r in top_q
    ]

    recent = (
        db.query(models.Sale)
        .options(
            joinedload(models.Sale.items).joinedload(models.SaleItem.product),
            joinedload(models.Sale.customer),
        )
        .filter(((models.Sale.business_id == bid) if br is None else and_(models.Sale.business_id == bid, models.Sale.branch_id == br)))
        .order_by(models.Sale.created_at.desc())
        .limit(5)
        .all()
    )


    # Mauzo ya leo — kamili (risiti, bidhaa, malipo)
    today_sales_full = (
        db.query(models.Sale)
        .options(
            joinedload(models.Sale.items).joinedload(models.SaleItem.product),
            joinedload(models.Sale.customer),
            joinedload(models.Sale.debt),
        )
        .filter(func.date(models.Sale.created_at) == today, ((models.Sale.business_id == bid) if br is None else and_(models.Sale.business_id == bid, models.Sale.branch_id == br)))
        .order_by(models.Sale.created_at.desc())
        .all()
    )

    open_debts = (
        db.query(models.Debt)
        .options(joinedload(models.Debt.customer), joinedload(models.Debt.payments))
        .filter(models.Debt.is_settled == False, models.Debt.business_id == bid)
        .order_by(models.Debt.remaining_amount.desc())
        .all()
    )


    # Faida kwa siku (siku 30 zilizopita)
    from datetime import timedelta
    start_30 = today - timedelta(days=29)
    sales_30 = (
        db.query(models.Sale)
        .options(joinedload(models.Sale.items))
        .filter(
            ((models.Sale.business_id == bid) if br is None else and_(models.Sale.business_id == bid, models.Sale.branch_id == br)),
            func.date(models.Sale.created_at) >= start_30,
            func.date(models.Sale.created_at) <= today,
        )
        .all()
    )
    day_map = {}
    for s in sales_30:
        d = s.created_at.date().isoformat() if s.created_at else None
        if not d:
            continue
        if d not in day_map:
            day_map[d] = {"date": d, "sales": 0.0, "cost": 0.0, "transactions": 0}
        day_map[d]["sales"] += s.total or 0
        day_map[d]["transactions"] += 1
        for it in s.items:
            day_map[d]["cost"] += (it.cost_price or 0) * (it.quantity or 0)
    profit_by_day = []
    for i in range(29, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        row = day_map.get(d, {"date": d, "sales": 0.0, "cost": 0.0, "transactions": 0})
        profit_by_day.append({
            "date": d,
            "sales": float(row["sales"]),
            "cost": float(row["cost"]),
            "profit": float(row["sales"]) - float(row["cost"]),
            "transactions": int(row["transactions"]),
        })

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
        sold_products=sold_products,
        today_sales_list=today_sales_full,
        open_debts=open_debts,
        profit_by_day=profit_by_day,
    )


@router.get("/report")
def sales_report(
    period: str = "week",
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    from datetime import timedelta

    bid = require_business(current_user)
    today = date.today()

    if period == "week":
        start = today - timedelta(days=today.weekday())
        end = today
    elif period == "month":
        start = today.replace(day=1)
        end = today
    else:
        start = start_date or (today - timedelta(days=7))
        end = end_date or today

    sales = (
        db.query(models.Sale)
        .options(
            joinedload(models.Sale.items).joinedload(models.SaleItem.product),
            joinedload(models.Sale.customer),
        )
        .filter(
            ((models.Sale.business_id == bid) if br is None else and_(models.Sale.business_id == bid, models.Sale.branch_id == br)),
            func.date(models.Sale.created_at) >= start,
            func.date(models.Sale.created_at) <= end,
        )
        .order_by(models.Sale.created_at.desc())
        .all()
    )

    total_sales = sum(s.total for s in sales)
    total_transactions = len(sales)
    cost = 0.0
    for s in sales:
        for it in s.items:
            cost += it.cost_price * it.quantity
    net_profit = total_sales - cost

    by_day = {}
    for s in sales:
        d = s.created_at.date().isoformat() if s.created_at else "unknown"
        if d not in by_day:
            by_day[d] = {"date": d, "total": 0.0, "count": 0}
        by_day[d]["total"] += s.total
        by_day[d]["count"] += 1
    daily = sorted(by_day.values(), key=lambda x: x["date"])

    prod_map = {}
    for s in sales:
        for it in s.items:
            name = it.product.name if it.product else f"#{it.product_id}"
            if name not in prod_map:
                prod_map[name] = {"name": name, "qty": 0, "revenue": 0.0}
            prod_map[name]["qty"] += it.quantity
            prod_map[name]["revenue"] += it.total
    top_products = sorted(prod_map.values(), key=lambda x: x["revenue"], reverse=True)[:10]

    return {
        "period": period,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "total_sales": total_sales,
        "total_transactions": total_transactions,
        "cost_of_goods": cost,
        "net_profit": net_profit,
        "daily": daily,
        "top_products": top_products,
        "sales": [
            {
                "id": s.id,
                "receipt_number": s.receipt_number,
                "total": s.total,
                "payment_method": s.payment_method,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "customer": s.customer.name if s.customer else None,
            }
            for s in sales
        ],
    }
