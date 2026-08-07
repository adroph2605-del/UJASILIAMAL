# WAJASILIAMALI

**Mfumo wa Kidijitali wa Usimamizi wa Mauzo, Stoki, Madeni, na Risiti kwa Wafanyabiashara Wadogo na Kati (SMEs)**

Web Application built with **React (Vite) + Tailwind CSS + react-i18next** (Frontend) and **FastAPI + SQLAlchemy + JWT** (Backend).

Supports **Kiswahili** and **English**.

---

## Features (MVP)

- Authentication (Register / Login) with JWT
- Dashboard – today’s sales, net profit, low-stock alerts, top products
- Inventory – add/edit/delete products, cost & selling price, stock levels
- POS (Point of Sale) – cart, cash / mobile money / debt, automatic stock deduction
- Debtors – list unpaid debts, record installment payments
- Receipt generation – downloadable PDF receipt

---

## Project Structure

```
wajasilimali/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── auth_utils.py
│   ├── requirements.txt
│   └── routers/
│       ├── auth.py
│       ├── products.py
│       ├── sales.py
│       ├── debtors.py
│       └── dashboard.py
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── i18n/
        │   ├── index.js
        │   ├── sw.json
        │   └── en.json
        ├── contexts/AuthContext.jsx
        ├── services/api.js
        ├── components/Navbar.jsx
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── Dashboard.jsx
            ├── Inventory.jsx
            ├── POS.jsx
            └── Debtors.jsx
```

---

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173

### 3. First Use

1. Go to **Register** and create an admin account.
2. Login.
3. Add products under **Inventory / Stoki**.
4. Make a sale under **POS**.
5. View debts under **Madeni**.

---

## Tech Stack

| Layer              | Technology                          |
|--------------------|-------------------------------------|
| Frontend           | React 18 + Vite + Tailwind CSS      |
| i18n               | react-i18next (SW / EN)             |
| Backend            | FastAPI + Pydantic + SQLAlchemy     |
| Auth               | JWT (python-jose) + bcrypt          |
| Database           | SQLite (default) / PostgreSQL ready |
| Receipts           | ReportLab (PDF)                     |

---

## Environment

- Backend default DB: `sqlite:///./wajasilimali.db`
- To use PostgreSQL: set `DATABASE_URL=postgresql://user:pass@localhost/wajasilimali`
- Change `SECRET_KEY` in `backend/auth_utils.py` for production.

---

## License

MIT – free for commercial and personal use.
