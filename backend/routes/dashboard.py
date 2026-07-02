"""
Dashboard Route — CloudSage AI (sqlite3 version)
GET /api/dashboard
"""

import math
from fastapi import APIRouter
from database.database import get_connection
from services.recommendation_engine import get_recommendations_summary
from services.anomaly_detection import detect_cost_anomalies
from services.finops_score import compute_finops_score
from services.sustainability import compute_sustainability_score

router = APIRouter()


def _scalar(conn, sql: str, default=0):
    row = conn.execute(sql).fetchone()
    return row[0] if row and row[0] is not None else default


@router.get("/dashboard", summary="Get dashboard summary metrics", tags=["Dashboard"])
def get_dashboard():
    conn = get_connection()
    try:
        # Latest month from cost history
        row = conn.execute(
            "SELECT * FROM cost_history ORDER BY month_index DESC LIMIT 1"
        ).fetchone()
        if row:
            monthly_cost = row["total_cost"]
            cost_by_service = {
                "EC2":    row["ec2_cost"],
                "S3":     row["s3_cost"],
                "RDS":    row["rds_cost"],
                "Lambda": row["lambda_cost"],
            }
        else:
            monthly_cost = (
                _scalar(conn, "SELECT SUM(monthly_cost) FROM ec2_resources")
                + _scalar(conn, "SELECT SUM(monthly_cost) FROM s3_buckets")
                + _scalar(conn, "SELECT SUM(monthly_cost) FROM rds_instances")
                + _scalar(conn, "SELECT SUM(monthly_cost) FROM lambda_functions")
            )
            cost_by_service = {
                "EC2":    _scalar(conn, "SELECT SUM(monthly_cost) FROM ec2_resources"),
                "S3":     _scalar(conn, "SELECT SUM(monthly_cost) FROM s3_buckets"),
                "RDS":    _scalar(conn, "SELECT SUM(monthly_cost) FROM rds_instances"),
                "Lambda": _scalar(conn, "SELECT SUM(monthly_cost) FROM lambda_functions"),
            }

        # Cost trend — last 7 months for area chart
        history = conn.execute(
            "SELECT month_label, total_cost FROM cost_history ORDER BY month_index DESC LIMIT 7"
        ).fetchall()
        trend_data = [{"name": r["month_label"], "cost": r["total_cost"]} for r in reversed(history)]
        if not trend_data:
            trend_data = [
                {"name": d, "cost": round(monthly_cost * (1 + 0.08 * math.sin(i * 1.1)))}
                for i, d in enumerate(["01", "05", "10", "15", "20", "25", "30"])
            ]

        resource_counts = {
            "ec2_instances":     _scalar(conn, "SELECT COUNT(*) FROM ec2_resources"),
            "s3_buckets":        _scalar(conn, "SELECT COUNT(*) FROM s3_buckets"),
            "rds_instances":     _scalar(conn, "SELECT COUNT(*) FROM rds_instances"),
            "lambda_functions":  _scalar(conn, "SELECT COUNT(*) FROM lambda_functions"),
        }
    finally:
        conn.close()

    rec_summary   = get_recommendations_summary()
    anomalies     = detect_cost_anomalies()
    finops_data   = compute_finops_score(anomaly_count=len(anomalies))
    sustain_data  = compute_sustainability_score()

    return {
        "monthly_cost":            round(monthly_cost, 2),
        "potential_savings":       rec_summary["total_monthly_savings"],
        "finops_score":            finops_data["score"],
        "finops_status":           finops_data["status"],
        "sustainability_score":    sustain_data["score"],
        "sustainability_status":   sustain_data["status"],
        "co2_reduction_estimate":  sustain_data["co2_reduction_estimate"],
        "anomalies":               len(anomalies),
        "anomaly_list":            anomalies[:5],
        "cost_by_service":         cost_by_service,
        "cost_trend":              trend_data,
        "resource_counts":         resource_counts,
        "recommendations_summary": rec_summary,
        "finops_breakdown":        finops_data["breakdown"],
    }
