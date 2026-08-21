from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, ensure_columns, SessionLocal
from routers import auth, products, sales, debtors, dashboard, branches
from auth_utils import get_password_hash
import models
import os

Base.metadata.create_all(bind=engine)
ensure_columns()


def seed_admin():
    db = SessionLocal()
    try:
        ADMIN_EMAIL = "adroph2605@gmail.com"
        ADMIN_PASSWORD = "juster"
        ADMIN_NAME = "Adroph Audiphance Andrea"
        BUSINESS_NAME = "WAJASILIAMALI Shop"

        existing = db.query(models.User).filter(models.User.email == ADMIN_EMAIL).first()
        if not existing:
            business = models.Business(name=BUSINESS_NAME, phone=None)
            db.add(business)
            db.flush()
            user = models.User(
                business_id=business.id,
                full_name=ADMIN_NAME,
                email=ADMIN_EMAIL,
                phone=None,
                hashed_password=get_password_hash(ADMIN_PASSWORD),
                role="admin",
                is_superuser=True,
                is_active=True,
            )
            db.add(user)
            db.commit()
            print(f"Admin+Business created: {ADMIN_EMAIL}")
        else:
            if not existing.business_id:
                business = models.Business(name=BUSINESS_NAME)
                db.add(business)
                db.flush()
                existing.business_id = business.id
            existing.role = "admin"
            existing.is_superuser = True
            existing.is_active = True
            existing.full_name = ADMIN_NAME
            existing.hashed_password = get_password_hash(ADMIN_PASSWORD)
            db.commit()
            print(f"Admin updated (superuser): {ADMIN_EMAIL}")
    except Exception as e:
        print(f"Seed error: {e}")
        db.rollback()
    finally:
        db.close()


seed_admin()

app = FastAPI(
    title="WAJASILIAMALI API",
    description="Mfumo wa Usimamizi wa Mauzo, Stoki, Madeni na Risiti kwa SMEs",
    version="1.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
)
# CORS: list explicit frontend origins (required when using Authorization header)
_default_origins = [
    "https://ujasiliamal.vercel.app",
    "https://ujasiliamal-7rbn.vercel.app",
    "https://ujasiliamal-sm2o.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
]
cors_env = os.getenv("CORS_ORIGINS", "").strip()
if cors_env and cors_env != "*":
    allow_origins = [o.strip() for o in cors_env.split(",") if o.strip()]
else:
    allow_origins = _default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(sales.router)
app.include_router(debtors.router)
app.include_router(dashboard.router)
app.include_router(branches.router)


@app.get("/")
def root():
    return {
        "app": "WAJASILIAMALI",
        "message": "Karibu! API is running.",
        "docs": "/docs",
        "version": "1.2.0",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
