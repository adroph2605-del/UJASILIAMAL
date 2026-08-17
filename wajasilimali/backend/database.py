from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

raw_url = os.getenv("DATABASE_URL") or "sqlite:///./wajasilimali.db"
if raw_url.startswith("postgres://"):
    raw_url = raw_url.replace("postgres://", "postgresql://", 1)

SQLALCHEMY_DATABASE_URL = raw_url

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_columns():
    """Add new columns/tables safely on existing DB."""
    try:
        with engine.begin() as conn:
            is_sqlite = SQLALCHEMY_DATABASE_URL.startswith("sqlite")
            # branches table
            try:
                if is_sqlite:
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS branches (
                            id INTEGER PRIMARY KEY,
                            business_id INTEGER NOT NULL,
                            name VARCHAR(150) NOT NULL,
                            phone VARCHAR(20),
                            address TEXT,
                            is_active BOOLEAN DEFAULT 1,
                            created_at DATETIME
                        )
                    """))
                else:
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS branches (
                            id SERIAL PRIMARY KEY,
                            business_id INTEGER NOT NULL REFERENCES businesses(id),
                            name VARCHAR(150) NOT NULL,
                            phone VARCHAR(20),
                            address TEXT,
                            is_active BOOLEAN DEFAULT TRUE,
                            created_at TIMESTAMPTZ DEFAULT NOW()
                        )
                    """))
            except Exception:
                pass

            for table in ("users", "products", "customers", "sales", "debts"):
                try:
                    if is_sqlite:
                        rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
                        cols = {r[1] for r in rows}
                        if "business_id" not in cols:
                            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN business_id INTEGER"))
                        if table == "products" and "image_url" not in cols:
                            conn.execute(text("ALTER TABLE products ADD COLUMN image_url TEXT"))
                        if table == "products" and "branch_id" not in cols:
                            conn.execute(text("ALTER TABLE products ADD COLUMN branch_id INTEGER"))
                        if table == "sales" and "branch_id" not in cols:
                            conn.execute(text("ALTER TABLE sales ADD COLUMN branch_id INTEGER"))
                        if table == "debts" and "branch_id" not in cols:
                            conn.execute(text("ALTER TABLE debts ADD COLUMN branch_id INTEGER"))
                        if table == "users" and "is_superuser" not in cols:
                            conn.execute(text("ALTER TABLE users ADD COLUMN is_superuser BOOLEAN DEFAULT 0"))
                    else:
                        conn.execute(text(
                            f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS business_id INTEGER"
                        ))
                        if table == "products":
                            conn.execute(text(
                                "ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT"
                            ))
                            conn.execute(text(
                                "ALTER TABLE products ADD COLUMN IF NOT EXISTS branch_id INTEGER"
                            ))
                        if table == "sales":
                            conn.execute(text(
                                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS branch_id INTEGER"
                            ))
                        if table == "debts":
                            conn.execute(text(
                                "ALTER TABLE debts ADD COLUMN IF NOT EXISTS branch_id INTEGER"
                            ))
                        if table == "users":
                            conn.execute(text(
                                "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_superuser BOOLEAN DEFAULT FALSE"
                            ))
                except Exception:
                    pass
    except Exception:
        pass
