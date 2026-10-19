from __future__ import annotations
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from .data import SALES, PRODUCTS

def _sales():
    return SALES.copy()

def dashboard_summary():
    sales = _sales()
    total_revenue = float(sales["revenue"].sum()) if len(sales) else 0
    orders = int(len(sales))
    units = int(sales["quantity"].sum()) if len(sales) else 0
    customers = int(sales["customer_id"].nunique()) if len(sales) else 0
    low_stock = int((PRODUCTS["stock"] < 30).sum())
    return {
        "total_revenue": round(total_revenue, 2),
        "orders": orders,
        "units_sold": units,
        "customers": customers,
        "low_stock_products": low_stock,
        "average_order_value": round(total_revenue / orders, 2) if orders else 0,
    }

def sales_trend():
    sales = _sales()

    if sales.empty:
        return []

    sales["date"] = pd.to_datetime(sales["date"])

    sales["date"] = sales["date"].dt.strftime("%Y-%m-%d")

    trend = (
        sales.groupby("date", as_index=False)
        .agg(
            revenue=("revenue", "sum"),
            units=("quantity", "sum"),
        )
        .sort_values("date")
    )

    return [
        {
            "date": r.date,
            "revenue": round(float(r.revenue), 2),
            "units": int(r.units),
        }
        for r in trend.itertuples(index=False)
    ]
def forecast(days: int = 30):
    """Simple baseline forecast: weekday-adjusted mean from the latest 8 weeks."""
    days = max(1, min(int(days), 90))
    sales = _sales()
    if sales.empty:
        return {"method": "weekday mean baseline", "forecast": []}
    daily = sales.groupby(pd.to_datetime(sales["date"]).dt.normalize())["quantity"].sum().sort_index()
    recent = daily.tail(56)
    weekday_means = recent.groupby(recent.index.dayofweek).mean()
    overall = float(recent.mean()) if len(recent) else 0.0
    last_day = pd.Timestamp(daily.index.max())
    rows = []
    for i in range(1, days + 1):
        d = last_day + pd.Timedelta(days=i)
        predicted = max(0, float(weekday_means.get(d.dayofweek, overall)))
        rows.append({"date": d.strftime("%Y-%m-%d"), "predicted_units": round(predicted, 1)})
    return {"method": "weekday mean baseline (demo; not Prophet/LSTM)", "forecast": rows}

def customer_segments():
    sales = _sales()
    if sales.empty:
        return []
    today = pd.Timestamp.today().normalize()
    sales["date"] = pd.to_datetime(sales["date"])
    rfm = sales.groupby("customer_id").agg(
        last_purchase=("date", "max"),
        frequency=("date", "count"),
        monetary=("revenue", "sum"),
    )
    rfm["recency_days"] = (today - rfm["last_purchase"].dt.normalize()).dt.days
    features = rfm[["recency_days", "frequency", "monetary"]].copy()
    features = np.log1p(features.clip(lower=0))
    scaled = StandardScaler().fit_transform(features)
    n_clusters = min(4, max(2, len(rfm) // 10))
    model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    rfm["cluster"] = model.fit_predict(scaled)
    # Labels are assigned by observed spend/frequency, not fixed cluster IDs.
    ranked = rfm.groupby("cluster").agg(spend=("monetary","mean"), freq=("frequency","mean")).sort_values(["spend","freq"])
    names = {}
    for rank, cluster in enumerate(ranked.index):
        names[cluster] = ["Occasional", "Developing", "Loyal", "High Value"][min(rank, 3)]
    rfm["segment"] = rfm["cluster"].map(names)
    grouped = rfm.groupby("segment").agg(
    customers=("segment", "size"),
    avg_spend=("monetary", "mean"),
    avg_recency_days=("recency_days", "mean"),
).reset_index()
    return [{"segment": r.segment, "customers": int(r.customers), "avg_spend": round(float(r.avg_spend),2), "avg_recency_days": round(float(r.avg_recency_days),1)} for r in grouped.itertuples()]

def churn_risk():
    """Transparent demo risk score; replace with a validated labelled churn model."""
    sales = _sales()
    if sales.empty:
        return []
    sales["date"] = pd.to_datetime(sales["date"])
    today = pd.Timestamp.today().normalize()
    customer = sales.groupby("customer_id").agg(
        last_purchase=("date","max"), orders=("date","count"), spend=("revenue","sum")
    )
    customer["days_since_purchase"] = (today - customer["last_purchase"].dt.normalize()).dt.days
    # Risk score is a simple rule-based proxy because synthetic data has no churn labels.
    recency_score = (customer["days_since_purchase"] / 60).clip(0, 1)
    low_frequency_score = (1 - customer["orders"] / max(float(customer["orders"].quantile(.9)), 1)).clip(0, 1)
    customer["risk_score"] = (0.75 * recency_score + 0.25 * low_frequency_score).clip(0, 1)
    customer["risk"] = pd.cut(customer["risk_score"], [-0.01, .35, .65, 1.01], labels=["Low","Medium","High"])
    result = customer.sort_values("risk_score", ascending=False).head(30).reset_index()
    return [{"customer_id": r.customer_id, "days_since_purchase": int(r.days_since_purchase), "orders": int(r.orders), "spend": round(float(r.spend),2), "risk_score": round(float(r.risk_score),3), "risk": str(r.risk)} for r in result.itertuples()]

def inventory_recommendations():
    sales = _sales()
    product = PRODUCTS.copy()
    if not sales.empty:
        recent = sales[pd.to_datetime(sales["date"]) >= pd.Timestamp.today().normalize() - pd.Timedelta(days=30)]
        demand = recent.groupby("product_id")["quantity"].sum() / 30
        product["avg_daily_demand"] = product["product_id"].map(demand).fillna(0)
    else:
        product["avg_daily_demand"] = 0
    product["safety_stock"] = np.ceil(product["avg_daily_demand"] * 7).astype(int)
    product["reorder_point"] = np.ceil(product["avg_daily_demand"] * 14 + product["safety_stock"]).astype(int)
    product["recommended_order"] = (product["reorder_point"] - product["stock"]).clip(lower=0).astype(int)
    product["status"] = np.where(product["stock"] <= product["reorder_point"], "Reorder", "Healthy")
    return [{"product_id": r.product_id, "category": r.category, "stock": int(r.stock), "avg_daily_demand": round(float(r.avg_daily_demand),2), "reorder_point": int(r.reorder_point), "recommended_order": int(r.recommended_order), "status": r.status} for r in product.itertuples()]

def replace_sales(uploaded: pd.DataFrame):
    required = {"date", "product_id", "quantity", "unit_price"}
    missing = required - set(uploaded.columns)
    if missing:
        raise ValueError("Missing required columns: " + ", ".join(sorted(missing)))
    data = uploaded.copy()
    data["date"] = pd.to_datetime(data["date"], errors="coerce")
    data["quantity"] = pd.to_numeric(data["quantity"], errors="coerce")
    data["unit_price"] = pd.to_numeric(data["unit_price"], errors="coerce")
    data = data.dropna(subset=["date","product_id","quantity","unit_price"])
    if (data["quantity"] < 0).any() or (data["unit_price"] < 0).any():
        raise ValueError("quantity and unit_price must be non-negative")
    if "customer_id" not in data:
        data["customer_id"] = "UNKNOWN"
    if "category" not in data:
        data["category"] = "Uncategorized"
    data["revenue"] = data["quantity"] * data["unit_price"]
    SALES.drop(SALES.index, inplace=True)
    for col in data.columns:
        SALES[col] = data[col].values
    return {"rows_loaded": int(len(data)), "rows_rejected": int(len(uploaded) - len(data))}
