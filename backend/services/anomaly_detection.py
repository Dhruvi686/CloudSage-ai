"""
Anomaly Detection — CloudSage AI
Uses sklearn IsolationForest on cost history and per-service resource data.
Uses sqlite3 directly — no ORM dependency.
"""

import numpy as np
from database.database import get_connection
from sklearn.ensemble import IsolationForest


def _rows(conn, sql: str) -> list[dict]:
    cur = conn.execute(sql)
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]


def detect_cost_anomalies() -> list[dict]:
    """
    Run IsolationForest on cost history and per-service cost outliers.
    Returns list of anomaly dicts with service, message, severity.
    """
    conn = get_connection()
    anomalies = []
    try:
        history = _rows(conn, "SELECT * FROM cost_history ORDER BY month_index")
        if len(history) >= 4:
            costs = np.array([h["total_cost"] for h in history]).reshape(-1, 1)
            iso = IsolationForest(contamination=0.15, random_state=42)
            labels = iso.fit_predict(costs)
            for i, (h, label) in enumerate(zip(history, labels)):
                if label == -1 and i > 0:
                    prev_cost = history[i - 1]["total_cost"]
                    pct = ((h["total_cost"] - prev_cost) / prev_cost) * 100
                    direction = "increase" if pct > 0 else "decrease"
                    severity = "High" if abs(pct) > 15 else "Medium"
                    anomalies.append({
                        "service": "Multi-Cloud",
                        "resource_id": None,
                        "message": f"Anomalous spend in {h['month_label']} {h['year']}: "
                                   f"${h['total_cost']:,.0f} ({pct:+.1f}% {direction} vs prior month).",
                        "severity": severity,
                    })

        # EC2 cost outliers
        ec2 = _rows(conn, "SELECT * FROM ec2_resources")
        if len(ec2) >= 3:
            costs_ec2 = np.array([r["monthly_cost"] for r in ec2]).reshape(-1, 1)
            iso2 = IsolationForest(contamination=0.1, random_state=42)
            labels2 = iso2.fit_predict(costs_ec2)
            for r, lbl in zip(ec2, labels2):
                if lbl == -1 and r["cpu_usage"] < 15:
                    anomalies.append({
                        "service": "EC2",
                        "resource_id": r["resource_id"],
                        "message": f"Instance {r['resource_id']} ({r['instance_type']}) costs "
                                   f"${r['monthly_cost']}/mo but averages only {r['cpu_usage']}% CPU.",
                        "severity": "High",
                    })

        # S3 cost outliers
        s3 = _rows(conn, "SELECT * FROM s3_buckets")
        if len(s3) >= 3:
            costs_s3 = np.array([b["monthly_cost"] for b in s3]).reshape(-1, 1)
            iso3 = IsolationForest(contamination=0.15, random_state=42)
            labels3 = iso3.fit_predict(costs_s3)
            mean_cost = float(np.mean(costs_s3))
            for b, lbl in zip(s3, labels3):
                if lbl == -1 and b["monthly_cost"] > mean_cost * 1.5:
                    anomalies.append({
                        "service": "S3",
                        "resource_id": b["bucket_name"],
                        "message": f"Bucket '{b['bucket_name']}' has unusually high cost "
                                   f"(${b['monthly_cost']}/mo, {b['size_gb']:.0f} GB).",
                        "severity": "Medium",
                    })
    finally:
        conn.close()

    return anomalies


def get_anomaly_count() -> int:
    return len(detect_cost_anomalies())
