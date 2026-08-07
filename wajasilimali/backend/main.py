from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, products, sales, debtors, dashboard

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="WAJASILIAMALI API",
    description="Mfumo wa Usimamizi wa Mauzo, Stoki, Madeni na Risiti kwa SMEs",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS - allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*",  # tighten in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(sales.router)
app.include_router(debtors.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {
        "app": "WAJASILIAMALI",
        "message": "Karibu! API is running.",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
