from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from io import BytesIO
from . import services

app = FastAPI(
    title="RetailPulse API",
    description="Retail sales analytics, demand forecast, customer insights and inventory recommendations.",
    version="0.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://retail-pulse-gules-chi.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "RetailPulse API is running", "docs": "/docs"}

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "RetailPulse API"}

@app.get("/api/dashboard")
def dashboard():
    return services.dashboard_summary()

@app.get("/api/sales/trend")
def trend():
    return services.sales_trend()

@app.get("/api/forecast")
def get_forecast(days: int = 30):
    if days < 1 or days > 90:
        raise HTTPException(status_code=400, detail="days must be between 1 and 90")
    return services.forecast(days)

@app.get("/api/customers/segments")
def segments():
    return services.customer_segments()

@app.get("/api/customers/churn")
def churn():
    return services.churn_risk()

@app.get("/api/inventory/recommendations")
def inventory():
    return services.inventory_recommendations()

@app.post("/api/data/upload")
async def upload_data(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a CSV file")
    try:
        content = await file.read()
        df = pd.read_csv(BytesIO(content))
        return services.replace_sales(df)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read CSV: {exc}")
