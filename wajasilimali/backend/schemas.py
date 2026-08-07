from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    STAFF = "staff"


class PaymentMethod(str, Enum):
    CASH = "cash"
    MOBILE_MONEY = "mobile_money"
    DEBT = "debt"


# ---------- Auth ----------
class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.ADMIN


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    phone: Optional[str]
    role: str
    is_active: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Product ----------
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    sku: Optional[str] = None
    barcode: Optional[str] = None
    description: Optional[str] = None
    cost_price: float = Field(..., ge=0)
    selling_price: float = Field(..., ge=0)
    quantity: int = Field(..., ge=0)
    low_stock_threshold: int = Field(5, ge=0)
    expiry_date: Optional[datetime] = None
    unit: str = "pcs"


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    description: Optional[str] = None
    cost_price: Optional[float] = Field(None, ge=0)
    selling_price: Optional[float] = Field(None, ge=0)
    quantity: Optional[int] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    expiry_date: Optional[datetime] = None
    unit: Optional[str] = None
    is_active: Optional[bool] = None


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]


# ---------- Customer ----------
class CustomerCreate(BaseModel):
    name: str = Field(..., min_length=1)
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None


class CustomerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    created_at: datetime


# ---------- Sale ----------
class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    unit_price: Optional[float] = None  # if None, use product.selling_price
    discount: float = 0.0


class SaleCreate(BaseModel):
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None  # quick create if no customer_id
    customer_phone: Optional[str] = None
    payment_method: PaymentMethod = PaymentMethod.CASH
    items: List[SaleItemCreate]
    discount: float = 0.0
    tax: float = 0.0
    amount_paid: Optional[float] = None
    notes: Optional[str] = None
    due_date: Optional[datetime] = None  # for debt


class SaleItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity: int
    unit_price: float
    cost_price: float
    discount: float
    total: float
    product: Optional[ProductOut] = None


class SaleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    receipt_number: str
    user_id: int
    customer_id: Optional[int]
    payment_method: str
    subtotal: float
    discount: float
    tax: float
    total: float
    amount_paid: float
    notes: Optional[str]
    created_at: datetime
    items: List[SaleItemOut] = []
    customer: Optional[CustomerOut] = None


# ---------- Debt ----------
class DebtPaymentCreate(BaseModel):
    amount: float = Field(..., gt=0)
    payment_method: PaymentMethod = PaymentMethod.CASH
    notes: Optional[str] = None


class DebtPaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    amount: float
    payment_method: str
    notes: Optional[str]
    created_at: datetime


class DebtOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    sale_id: Optional[int]
    original_amount: float
    remaining_amount: float
    due_date: Optional[datetime]
    notes: Optional[str]
    is_settled: bool
    created_at: datetime
    customer: Optional[CustomerOut] = None
    payments: List[DebtPaymentOut] = []


# ---------- Dashboard ----------
class DashboardStats(BaseModel):
    today_sales: float
    today_transactions: int
    total_products: int
    low_stock_count: int
    total_debts: float
    unpaid_debts_count: int
    net_profit_today: float
    top_products: List[dict] = []
    recent_sales: List[SaleOut] = []
    low_stock_products: List[ProductOut] = []
