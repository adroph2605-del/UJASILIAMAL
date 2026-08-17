from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date
from database import get_db
import models, schemas
from auth_utils import get_current_user
from tenant import require_business
from typing import Optional
from fastapi import Header, Query
import uuid

router = APIRouter(prefix="/api/sales", tags=["Sales / POS"])


def generate_receipt_number() -> str:
    return f"RCP-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"


@router.post("/", response_model=schemas.SaleOut, status_code=status.HTTP_201_CREATED)
def create_sale(
    sale_in: schemas.SaleCreate,
    x_branch_id: Optional[str] = Header(None, alias="X-Branch-Id"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not sale_in.items:
        raise HTTPException(status_code=400, detail="Sale must have at least one item")

    bid = require_business(current_user)

    customer_id = sale_in.customer_id
    if customer_id:
        cust = db.query(models.Customer).filter(
            models.Customer.id == customer_id,
            models.Customer.business_id == bid,
        ).first()
        if not cust:
            raise HTTPException(status_code=404, detail="Customer not found")
    if not customer_id and sale_in.customer_name:
        customer = models.Customer(
            business_id=bid,
            name=sale_in.customer_name,
            phone=sale_in.customer_phone,
        )
        db.add(customer)
        db.flush()
        customer_id = customer.id

    subtotal = 0.0
    sale_items_data = []

    for item_in in sale_in.items:
        product = db.query(models.Product).filter(
            models.Product.id == item_in.product_id,
            models.Product.business_id == bid,
        ).first()
        if not product or not product.is_active:
            raise HTTPException(status_code=404, detail=f"Product {item_in.product_id} not found")
        if product.quantity < item_in.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.quantity}",
            )

        unit_price = item_in.unit_price if item_in.unit_price is not None else product.selling_price
        item_total = (unit_price * item_in.quantity) - item_in.discount
        subtotal += item_total

        sale_items_data.append({
            "product": product,
            "quantity": item_in.quantity,
            "unit_price": unit_price,
            "cost_price": product.cost_price,
            "discount": item_in.discount,
            "total": item_total,
        })

    discount = sale_in.discount
    tax = sale_in.tax
    total = subtotal - discount + tax
    amount_paid = sale_in.amount_paid if sale_in.amount_paid is not None else (
        0.0 if sale_in.payment_method == schemas.PaymentMethod.DEBT else total
    )

    # branch for this sale
    sale_branch = getattr(sale_in, 'branch_id', None)
    if sale_branch is None and x_branch_id:
        try:
            sale_branch = int(x_branch_id)
        except ValueError:
            sale_branch = None

    sale = models.Sale(
        business_id=bid,
        branch_id=sale_branch,
        receipt_number=generate_receipt_number(),
        user_id=current_user.id,
        customer_id=customer_id,
        payment_method=sale_in.payment_method.value,
        subtotal=subtotal,
        discount=discount,
        tax=tax,
        total=total,
        amount_paid=amount_paid,
        notes=sale_in.notes,
    )
    db.add(sale)
    db.flush()

    for item_data in sale_items_data:
        product = item_data["product"]
        sale_item = models.SaleItem(
            sale_id=sale.id,
            product_id=product.id,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            cost_price=item_data["cost_price"],
            discount=item_data["discount"],
            total=item_data["total"],
        )
        db.add(sale_item)
        product.quantity -= item_data["quantity"]

    if sale_in.payment_method == schemas.PaymentMethod.DEBT:
        remaining = total - amount_paid
        if remaining > 0:
            if not customer_id:
                raise HTTPException(status_code=400, detail="Customer required for debt sales")
            debt = models.Debt(
                business_id=bid,
                branch_id=sale_branch,
                customer_id=customer_id,
                sale_id=sale.id,
                original_amount=remaining,
                remaining_amount=remaining,
                due_date=sale_in.due_date,
                notes=sale_in.notes,
            )
            db.add(debt)

    db.commit()
    db.refresh(sale)

    sale = (
        db.query(models.Sale)
        .options(
            joinedload(models.Sale.items).joinedload(models.SaleItem.product),
            joinedload(models.Sale.customer),
        )
        .filter(models.Sale.id == sale.id)
        .first()
    )
    return sale


@router.get("/", response_model=List[schemas.SaleOut])
def create_sale(
    sale_in: schemas.SaleCreate,
    x_branch_id: Optional[str] = Header(None, alias="X-Branch-Id"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not sale_in.items:
        raise HTTPException(status_code=400, detail="Sale must have at least one item")

    bid = require_business(current_user)

    customer_id = sale_in.customer_id
    if customer_id:
        cust = db.query(models.Customer).filter(
            models.Customer.id == customer_id,
            models.Customer.business_id == bid,
        ).first()
        if not cust:
            raise HTTPException(status_code=404, detail="Customer not found")
    if not customer_id and sale_in.customer_name:
        customer = models.Customer(
            business_id=bid,
            name=sale_in.customer_name,
            phone=sale_in.customer_phone,
        )
        db.add(customer)
        db.flush()
        customer_id = customer.id

    subtotal = 0.0
    sale_items_data = []

    for item_in in sale_in.items:
        product = db.query(models.Product).filter(
            models.Product.id == item_in.product_id,
            models.Product.business_id == bid,
        ).first()
        if not product or not product.is_active:
            raise HTTPException(status_code=404, detail=f"Product {item_in.product_id} not found")
        if product.quantity < item_in.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.quantity}",
            )

        unit_price = item_in.unit_price if item_in.unit_price is not None else product.selling_price
        item_total = (unit_price * item_in.quantity) - item_in.discount
        subtotal += item_total

        sale_items_data.append({
            "product": product,
            "quantity": item_in.quantity,
            "unit_price": unit_price,
            "cost_price": product.cost_price,
            "discount": item_in.discount,
            "total": item_total,
        })

    discount = sale_in.discount
    tax = sale_in.tax
    total = subtotal - discount + tax
    amount_paid = sale_in.amount_paid if sale_in.amount_paid is not None else (
        0.0 if sale_in.payment_method == schemas.PaymentMethod.DEBT else total
    )

    # branch for this sale
    sale_branch = getattr(sale_in, 'branch_id', None)
    if sale_branch is None and x_branch_id:
        try:
            sale_branch = int(x_branch_id)
        except ValueError:
            sale_branch = None

    sale = models.Sale(
        business_id=bid,
        branch_id=sale_branch,
        receipt_number=generate_receipt_number(),
        user_id=current_user.id,
        customer_id=customer_id,
        payment_method=sale_in.payment_method.value,
        subtotal=subtotal,
        discount=discount,
        tax=tax,
        total=total,
        amount_paid=amount_paid,
        notes=sale_in.notes,
    )
    db.add(sale)
    db.flush()

    for item_data in sale_items_data:
        product = item_data["product"]
        sale_item = models.SaleItem(
            sale_id=sale.id,
            product_id=product.id,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            cost_price=item_data["cost_price"],
            discount=item_data["discount"],
            total=item_data["total"],
        )
        db.add(sale_item)
        product.quantity -= item_data["quantity"]

    if sale_in.payment_method == schemas.PaymentMethod.DEBT:
        remaining = total - amount_paid
        if remaining > 0:
            if not customer_id:
                raise HTTPException(status_code=400, detail="Customer required for debt sales")
            debt = models.Debt(
                business_id=bid,
                branch_id=sale_branch,
                customer_id=customer_id,
                sale_id=sale.id,
                original_amount=remaining,
                remaining_amount=remaining,
                due_date=sale_in.due_date,
                notes=sale_in.notes,
            )
            db.add(debt)

    db.commit()
    db.refresh(sale)

    sale = (
        db.query(models.Sale)
        .options(
            joinedload(models.Sale.items).joinedload(models.SaleItem.product),
            joinedload(models.Sale.customer),
        )
        .filter(models.Sale.id == sale.id)
        .first()
    )
    return sale


@router.get("/", response_model=List[schemas.SaleOut])
def create_sale(
    sale_in: schemas.SaleCreate,
    x_branch_id: Optional[str] = Header(None, alias="X-Branch-Id"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not sale_in.items:
        raise HTTPException(status_code=400, detail="Sale must have at least one item")

    bid = require_business(current_user)

    customer_id = sale_in.customer_id
    if customer_id:
        cust = db.query(models.Customer).filter(
            models.Customer.id == customer_id,
            models.Customer.business_id == bid,
        ).first()
        if not cust:
            raise HTTPException(status_code=404, detail="Customer not found")
    if not customer_id and sale_in.customer_name:
        customer = models.Customer(
            business_id=bid,
            name=sale_in.customer_name,
            phone=sale_in.customer_phone,
        )
        db.add(customer)
        db.flush()
        customer_id = customer.id

    subtotal = 0.0
    sale_items_data = []

    for item_in in sale_in.items:
        product = db.query(models.Product).filter(
            models.Product.id == item_in.product_id,
            models.Product.business_id == bid,
        ).first()
        if not product or not product.is_active:
            raise HTTPException(status_code=404, detail=f"Product {item_in.product_id} not found")
        if product.quantity < item_in.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.quantity}",
            )

        unit_price = item_in.unit_price if item_in.unit_price is not None else product.selling_price
        item_total = (unit_price * item_in.quantity) - item_in.discount
        subtotal += item_total

        sale_items_data.append({
            "product": product,
            "quantity": item_in.quantity,
            "unit_price": unit_price,
            "cost_price": product.cost_price,
            "discount": item_in.discount,
            "total": item_total,
        })

    discount = sale_in.discount
    tax = sale_in.tax
    total = subtotal - discount + tax
    amount_paid = sale_in.amount_paid if sale_in.amount_paid is not None else (
        0.0 if sale_in.payment_method == schemas.PaymentMethod.DEBT else total
    )

    # branch for this sale
    sale_branch = getattr(sale_in, 'branch_id', None)
    if sale_branch is None and x_branch_id:
        try:
            sale_branch = int(x_branch_id)
        except ValueError:
            sale_branch = None

    sale = models.Sale(
        business_id=bid,
        branch_id=sale_branch,
        receipt_number=generate_receipt_number(),
        user_id=current_user.id,
        customer_id=customer_id,
        payment_method=sale_in.payment_method.value,
        subtotal=subtotal,
        discount=discount,
        tax=tax,
        total=total,
        amount_paid=amount_paid,
        notes=sale_in.notes,
    )
    db.add(sale)
    db.flush()

    for item_data in sale_items_data:
        product = item_data["product"]
        sale_item = models.SaleItem(
            sale_id=sale.id,
            product_id=product.id,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            cost_price=item_data["cost_price"],
            discount=item_data["discount"],
            total=item_data["total"],
        )
        db.add(sale_item)
        product.quantity -= item_data["quantity"]

    if sale_in.payment_method == schemas.PaymentMethod.DEBT:
        remaining = total - amount_paid
        if remaining > 0:
            if not customer_id:
                raise HTTPException(status_code=400, detail="Customer required for debt sales")
            debt = models.Debt(
                business_id=bid,
                branch_id=sale_branch,
                customer_id=customer_id,
                sale_id=sale.id,
                original_amount=remaining,
                remaining_amount=remaining,
                due_date=sale_in.due_date,
                notes=sale_in.notes,
            )
            db.add(debt)

    db.commit()
    db.refresh(sale)

    sale = (
        db.query(models.Sale)
        .options(
            joinedload(models.Sale.items).joinedload(models.SaleItem.product),
            joinedload(models.Sale.customer),
        )
        .filter(models.Sale.id == sale.id)
        .first()
    )
    return sale


@router.get("/", response_model=List[schemas.SaleOut])
def create_sale(
    sale_in: schemas.SaleCreate,
    x_branch_id: Optional[str] = Header(None, alias="X-Branch-Id"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not sale_in.items:
        raise HTTPException(status_code=400, detail="Sale must have at least one item")

    bid = require_business(current_user)

    customer_id = sale_in.customer_id
    if customer_id:
        cust = db.query(models.Customer).filter(
            models.Customer.id == customer_id,
            models.Customer.business_id == bid,
        ).first()
        if not cust:
            raise HTTPException(status_code=404, detail="Customer not found")
    if not customer_id and sale_in.customer_name:
        customer = models.Customer(
            business_id=bid,
            name=sale_in.customer_name,
            phone=sale_in.customer_phone,
        )
        db.add(customer)
        db.flush()
        customer_id = customer.id

    subtotal = 0.0
    sale_items_data = []

    for item_in in sale_in.items:
        product = db.query(models.Product).filter(
            models.Product.id == item_in.product_id,
            models.Product.business_id == bid,
        ).first()
        if not product or not product.is_active:
            raise HTTPException(status_code=404, detail=f"Product {item_in.product_id} not found")
        if product.quantity < item_in.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.quantity}",
            )

        unit_price = item_in.unit_price if item_in.unit_price is not None else product.selling_price
        item_total = (unit_price * item_in.quantity) - item_in.discount
        subtotal += item_total

        sale_items_data.append({
            "product": product,
            "quantity": item_in.quantity,
            "unit_price": unit_price,
            "cost_price": product.cost_price,
            "discount": item_in.discount,
            "total": item_total,
        })

    discount = sale_in.discount
    tax = sale_in.tax
    total = subtotal - discount + tax
    amount_paid = sale_in.amount_paid if sale_in.amount_paid is not None else (
        0.0 if sale_in.payment_method == schemas.PaymentMethod.DEBT else total
    )

    # branch for this sale
    sale_branch = getattr(sale_in, 'branch_id', None)
    if sale_branch is None and x_branch_id:
        try:
            sale_branch = int(x_branch_id)
        except ValueError:
            sale_branch = None

    sale = models.Sale(
        business_id=bid,
        branch_id=sale_branch,
        receipt_number=generate_receipt_number(),
        user_id=current_user.id,
        customer_id=customer_id,
        payment_method=sale_in.payment_method.value,
        subtotal=subtotal,
        discount=discount,
        tax=tax,
        total=total,
        amount_paid=amount_paid,
        notes=sale_in.notes,
    )
    db.add(sale)
    db.flush()

    for item_data in sale_items_data:
        product = item_data["product"]
        sale_item = models.SaleItem(
            sale_id=sale.id,
            product_id=product.id,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            cost_price=item_data["cost_price"],
            discount=item_data["discount"],
            total=item_data["total"],
        )
        db.add(sale_item)
        product.quantity -= item_data["quantity"]

    if sale_in.payment_method == schemas.PaymentMethod.DEBT:
        remaining = total - amount_paid
        if remaining > 0:
            if not customer_id:
                raise HTTPException(status_code=400, detail="Customer required for debt sales")
            debt = models.Debt(
                business_id=bid,
                branch_id=sale_branch,
                customer_id=customer_id,
                sale_id=sale.id,
                original_amount=remaining,
                remaining_amount=remaining,
                due_date=sale_in.due_date,
                notes=sale_in.notes,
            )
            db.add(debt)

    db.commit()
    db.refresh(sale)

    sale = (
        db.query(models.Sale)
        .options(
            joinedload(models.Sale.items).joinedload(models.SaleItem.product),
            joinedload(models.Sale.customer),
        )
        .filter(models.Sale.id == sale.id)
        .first()
    )
    return sale


@router.get("/", response_model=List[schemas.SaleOut])
def list_sales(
    skip: int = 0,
    limit: int = 50,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    branch_id: Optional[int] = Query(None),
    x_branch_id: Optional[str] = Header(None, alias="X-Branch-Id"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    bid = require_business(current_user)
    query = (
        db.query(models.Sale)
        .options(
            joinedload(models.Sale.items).joinedload(models.SaleItem.product),
            joinedload(models.Sale.customer),
        )
        .filter(models.Sale.business_id == bid)
        .order_by(models.Sale.created_at.desc())
    )
    if br is not None:
        query = query.filter(models.Sale.branch_id == br)
    if start_date:
        query = query.filter(func.date(models.Sale.created_at) >= start_date)
    if end_date:
        query = query.filter(func.date(models.Sale.created_at) <= end_date)

    return query.offset(skip).limit(limit).all()


@router.get("/{sale_id}", response_model=schemas.SaleOut)
def get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    sale = (
        db.query(models.Sale)
        .options(
            joinedload(models.Sale.items).joinedload(models.SaleItem.product),
            joinedload(models.Sale.customer),
        )
        .filter(models.Sale.id == sale_id, models.Sale.business_id == require_business(current_user))
        .first()
    )
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale


@router.get("/receipt/{sale_id}/pdf")
def get_receipt_pdf(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    from fastapi.responses import StreamingResponse
    from io import BytesIO
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas

    sale = (
        db.query(models.Sale)
        .options(
            joinedload(models.Sale.items).joinedload(models.SaleItem.product),
            joinedload(models.Sale.customer),
            joinedload(models.Sale.user),
        )
        .filter(models.Sale.id == sale_id, models.Sale.business_id == require_business(current_user))
        .first()
    )
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    y = height - 40
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2, y, "WAJASILIAMALI")
    y -= 20
    c.setFont("Helvetica", 10)
    c.drawCentredString(width / 2, y, "Risiti ya Mauzo / Sales Receipt")
    y -= 30

    c.setFont("Helvetica", 9)
    c.drawString(40, y, f"Receipt No: {sale.receipt_number}")
    y -= 15
    c.drawString(40, y, f"Date: {sale.created_at.strftime('%Y-%m-%d %H:%M')}")
    y -= 15
    c.drawString(40, y, f"Cashier: {sale.user.full_name if sale.user else 'N/A'}")
    y -= 15
    if sale.customer:
        c.drawString(40, y, f"Customer: {sale.customer.name}")
        y -= 15
        if sale.customer.phone:
            c.drawString(40, y, f"Phone: {sale.customer.phone}")
            y -= 15

    y -= 10
    c.line(40, y, width - 40, y)
    y -= 20

    c.setFont("Helvetica-Bold", 9)
    c.drawString(40, y, "Item")
    c.drawString(250, y, "Qty")
    c.drawString(300, y, "Price")
    c.drawString(370, y, "Total")
    y -= 15
    c.setFont("Helvetica", 9)

    for item in sale.items:
        name = item.product.name if item.product else f"Product #{item.product_id}"
        if len(name) > 30:
            name = name[:27] + "..."
        c.drawString(40, y, name)
        c.drawString(250, y, str(item.quantity))
        c.drawString(300, y, f"{item.unit_price:,.0f}")
        c.drawString(370, y, f"{item.total:,.0f}")
        y -= 14
        if y < 100:
            c.showPage()
            y = height - 40

    y -= 10
    c.line(40, y, width - 40, y)
    y -= 20

    c.drawString(250, y, "Subtotal:")
    c.drawString(370, y, f"{sale.subtotal:,.0f}")
    y -= 14
    if sale.discount:
        c.drawString(250, y, "Discount:")
        c.drawString(370, y, f"-{sale.discount:,.0f}")
        y -= 14
    if sale.tax:
        c.drawString(250, y, "Tax (VAT):")
        c.drawString(370, y, f"{sale.tax:,.0f}")
        y -= 14

    c.setFont("Helvetica-Bold", 11)
    c.drawString(250, y, "TOTAL:")
    c.drawString(370, y, f"{sale.total:,.0f} TZS")
    y -= 20

    c.setFont("Helvetica", 9)
    c.drawString(40, y, f"Payment: {sale.payment_method.upper()}")
    y -= 14
    c.drawString(40, y, f"Amount Paid: {sale.amount_paid:,.0f} TZS")
    y -= 30

    c.setFont("Helvetica-Oblique", 8)
    c.drawCentredString(width / 2, y, "Asante kwa kununua! / Thank you for your purchase!")
    y -= 15
    c.drawCentredString(width / 2, y, "WAJASILIAMALI - Usimamizi wa Biashara")

    c.save()
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="receipt_{sale.receipt_number}.pdf"'},
    )
