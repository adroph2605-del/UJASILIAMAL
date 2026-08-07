from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    STAFF = "staff"


class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    MOBILE_MONEY = "mobile_money"
    DEBT = "debt"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default=UserRole.ADMIN.value)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sales = relationship("Sale", back_populates="user")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    sku = Column(String(50), unique=True, nullable=True)
    barcode = Column(String(50), unique=True, nullable=True)
    description = Column(Text, nullable=True)
    cost_price = Column(Float, nullable=False, default=0.0)  # Bei ya ununuzi
    selling_price = Column(Float, nullable=False, default=0.0)  # Bei ya kuuzia
    quantity = Column(Integer, nullable=False, default=0)
    low_stock_threshold = Column(Integer, default=5)
    expiry_date = Column(DateTime, nullable=True)
    unit = Column(String(30), default="pcs")  # pcs, kg, liters, etc.
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    sale_items = relationship("SaleItem", back_populates="product")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True, index=True)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    debts = relationship("Debt", back_populates="customer")
    sales = relationship("Sale", back_populates="customer")


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    receipt_number = Column(String(30), unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    payment_method = Column(String(20), default=PaymentMethod.CASH.value)
    subtotal = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)  # VAT
    total = Column(Float, default=0.0)
    amount_paid = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="sales")
    customer = relationship("Customer", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")
    debt = relationship("Debt", back_populates="sale", uselist=False)


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=False)  # snapshot at sale time
    discount = Column(Float, default=0.0)
    total = Column(Float, nullable=False)

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product", back_populates="sale_items")


class Debt(Base):
    __tablename__ = "debts"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True)
    original_amount = Column(Float, nullable=False)
    remaining_amount = Column(Float, nullable=False)
    due_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    is_settled = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    customer = relationship("Customer", back_populates="debts")
    sale = relationship("Sale", back_populates="debt")
    payments = relationship("DebtPayment", back_populates="debt", cascade="all, delete-orphan")


class DebtPayment(Base):
    __tablename__ = "debt_payments"

    id = Column(Integer, primary_key=True, index=True)
    debt_id = Column(Integer, ForeignKey("debts.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(20), default=PaymentMethod.CASH.value)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    debt = relationship("Debt", back_populates="payments")
