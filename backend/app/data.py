from __future__ import annotations
import numpy as np
import pandas as pd

def make_demo_data(seed: int = 42):
    """Create reproducible synthetic retail data for a safe local demo."""
    rng = np.random.default_rng(seed)
    dates = pd.date_range(end=pd.Timestamp.today().normalize(), periods=180, freq="D")
    products = [f"P-{i:03d}" for i in range(1, 13)]
    categories = ["Grocery", "Home", "Beauty", "Electronics"]
    product_rows = []
    for i, product in enumerate(products):
        product_rows.append({
            "product_id": product,
            "category": categories[i % len(categories)],
            "unit_price": round(float(rng.uniform(5, 120)), 2),
            "stock": int(rng.integers(8, 180)),
            "daily_base": int(rng.integers(8, 35)),
        })
    product_df = pd.DataFrame(product_rows)
    sales_rows = []
    customer_ids = [f"C-{i:04d}" for i in range(1, 251)]
    for date in dates:
        weekend_boost = 1.18 if date.dayofweek >= 5 else 1.0
        for p in product_rows:
            qty = max(0, int(rng.poisson(p["daily_base"] * weekend_boost)))
            if qty:
                for _ in range(max(1, min(3, qty // 8))):
                    customer = str(rng.choice(customer_ids))
                    line_qty = max(1, int(rng.integers(1, 4)))
                    sales_rows.append({
                        "date": date,
                        "product_id": p["product_id"],
                        "category": p["category"],
                        "customer_id": customer,
                        "quantity": line_qty,
                        "unit_price": p["unit_price"],
                    })
    sales = pd.DataFrame(sales_rows)
    if sales.empty:
        sales = pd.DataFrame(columns=["date","product_id","category","customer_id","quantity","unit_price"])
    sales["revenue"] = sales["quantity"] * sales["unit_price"]
    return sales, product_df

SALES, PRODUCTS = make_demo_data()
