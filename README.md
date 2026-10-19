# RetailPulse — AI-Powered Customer Analytics & Demand Forecasting

A full-stack learning project with a React frontend, FastAPI backend, synthetic demo data, and baseline machine-learning workflows.

## Features
- KPI dashboard and sales trends
- Demand forecast endpoint (baseline time-series model)
- Customer segmentation using RFM features + K-Means
- Customer churn-risk baseline classifier
- Inventory reorder recommendations
- CSV upload for sales data
- Health/status endpoint and interactive API docs

> This is a starter implementation. It uses generated demo data and baseline models, not production-validated forecasts. Replace demo data with your permitted dataset, evaluate models properly, and follow your program's rules for AI assistance.

## Stack
- Frontend: React, Vite, Recharts, Axios
- Backend: Python, FastAPI, Pandas, NumPy, scikit-learn
- Optional next steps: PostgreSQL, Prophet/LSTM, MLflow, Docker, CI/CD, monitoring

## Requirements
- Python 3.11 recommended
- Node.js 20+ and npm

## Run locally

### 1. Backend
Open a terminal in `backend/`:

Windows:
```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

macOS/Linux:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend: http://127.0.0.1:8000  
API documentation: http://127.0.0.1:8000/docs

### 2. Frontend
Open a second terminal in `frontend/`:

```bash
npm install
npm run dev
```

Frontend: http://localhost:5173

## CSV upload format
The upload endpoint accepts a CSV containing at least:
`date, product_id, quantity, unit_price`
Optional: `customer_id, category, stock`

Dates should be parseable dates; quantity and unit_price should be numeric.

## API endpoints
- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/sales/trend`
- `GET /api/forecast?days=30`
- `GET /api/customers/segments`
- `GET /api/customers/churn`
- `GET /api/inventory/recommendations`
- `POST /api/data/upload`

## Suggested development order
1. Run the starter and explore each page.
2. Read the backend functions and understand the calculations.
3. Add validation and tests.
4. Evaluate forecasting with a time-based holdout and report MAE/MAPE.
5. Replace the baseline churn heuristic/classifier with a trained, evaluated model.
6. Add PostgreSQL persistence and authentication before handling real customer data.
7. Add MLflow, drift monitoring, Docker and deployment only after local tests pass.
