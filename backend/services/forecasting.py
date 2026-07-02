"""
Forecasting Service — CloudSage AI
Uses sklearn LinearRegression on 12-month cost history.
Uses sqlite3 directly — no ORM dependency.
"""

import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score
from database.database import get_connection


def _rows(conn, sql: str) -> list[dict]:
    cur = conn.execute(sql)
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]


def run_forecast() -> dict:
    conn = get_connection()
    try:
        history = _rows(conn, "SELECT * FROM cost_history ORDER BY month_index")
    finally:
        conn.close()

    if len(history) < 3:
        return {
            "next_month_prediction": 0,
            "confidence": 0.0,
            "trend": "Stable",
            "trend_pct": 0.0,
            "projection": [],
            "history": [],
        }

    X = np.array([h["month_index"] for h in history]).reshape(-1, 1)
    y = np.array([h["total_cost"] for h in history])
    model = LinearRegression()
    model.fit(X, y)
    y_pred_train = model.predict(X)
    r2 = float(np.clip(r2_score(y, y_pred_train), 0.0, 1.0))

    next_idx = int(X[-1][0]) + 1
    next_cost = float(model.predict([[next_idx]])[0])
    slope = float(model.coef_[0])
    last_cost = float(y[-1])

    if slope > last_cost * 0.005:
        trend, trend_pct = "Increasing", round((slope / last_cost) * 100, 1)
    elif slope < -last_cost * 0.005:
        trend, trend_pct = "Decreasing", round((slope / last_cost) * 100, 1)
    else:
        trend, trend_pct = "Stable", 0.0

    month_labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    last_label_idx = month_labels.index(history[-1]["month_label"])
    last_year = history[-1]["year"]

    projection = []
    for i in range(1, 7):
        future_cost = float(model.predict([[next_idx + i - 1]])[0])
        label_idx = (last_label_idx + i) % 12
        year_offset = (last_label_idx + i) // 12
        projection.append({
            "month": month_labels[label_idx],
            "year": last_year + year_offset,
            "predicted_cost": round(future_cost),
            "month_index": next_idx + i - 1,
        })

    history_chart = [
        {
            "month": h["month_label"],
            "year": h["year"],
            "actual_cost": h["total_cost"],
            "fitted_cost": round(float(fitted)),
            "ec2_cost": h["ec2_cost"],
            "s3_cost": h["s3_cost"],
            "rds_cost": h["rds_cost"],
            "lambda_cost": h["lambda_cost"],
        }
        for h, fitted in zip(history, y_pred_train)
    ]

    return {
        "next_month_prediction": round(next_cost),
        "confidence": round(r2, 4),
        "trend": trend,
        "trend_pct": trend_pct,
        "projection": projection,
        "history": history_chart,
        "model_slope": round(slope, 2),
    }


def run_simulation(reserved_pct: float = 40.0, storage_tier: int = 1, idle_cleanup_pct: float = 35.0) -> dict:
    baseline = run_forecast()
    projection = baseline["projection"]
    ri_factor = (reserved_pct / 100) * 0.30
    storage_factor = (storage_tier / 2) * 0.15
    idle_factor = (idle_cleanup_pct / 100) * 0.10
    total_savings_factor = ri_factor + storage_factor + idle_factor

    optimized = []
    for p in projection:
        opt_cost = round(p["predicted_cost"] * (1 - total_savings_factor))
        optimized.append({**p, "optimized_cost": opt_cost, "monthly_savings": p["predicted_cost"] - opt_cost})

    return {
        "baseline_projection": projection,
        "optimized_projection": optimized,
        "total_6m_savings": round(sum(p["monthly_savings"] for p in optimized)),
        "savings_pct": round(total_savings_factor * 100, 1),
        "levers": {
            "reserved_instance_savings_pct": round(ri_factor * 100, 1),
            "storage_tier_savings_pct": round(storage_factor * 100, 1),
            "idle_cleanup_savings_pct": round(idle_factor * 100, 1),
        },
    }
