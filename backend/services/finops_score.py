"""
FinOps Health Score — CloudSage AI
Uses sqlite3 directly — no ORM dependency.
"""

from database.database import get_connection


def _count_where(conn, table: str, condition: str) -> int:
    return conn.execute(f"SELECT COUNT(*) FROM {table} WHERE {condition}").fetchone()[0]


def _status_label(score: int) -> str:
    if score >= 90: return "Exceptional"
    if score >= 80: return "Healthy"
    if score >= 65: return "Fair"
    if score >= 50: return "At Risk"
    return "Critical"


def compute_finops_score(anomaly_count: int = 0) -> dict:
    conn = get_connection()
    try:
        ec2_data = conn.execute("SELECT cpu_usage FROM ec2_resources").fetchall()
        ec2_idle  = sum(1 for r in ec2_data if r[0] < 10)
        ec2_under = sum(1 for r in ec2_data if r[0] >= 10 and r[0] < 30)
        s3_cold   = _count_where(conn, "s3_buckets",    "last_access_days > 90")
        rds_idle  = _count_where(conn, "rds_instances", "connections < 5")
        rds_under = _count_where(conn, "rds_instances", "connections >= 5 AND connections < 20")
        lam_over  = _count_where(conn, "lambda_functions",
                                 "memory_allocated_mb > 0 AND CAST(memory_used_mb AS REAL)/memory_allocated_mb < 0.4")

        ec2_total = len(ec2_data)
        s3_total  = conn.execute("SELECT COUNT(*) FROM s3_buckets").fetchone()[0]
        rds_total = conn.execute("SELECT COUNT(*) FROM rds_instances").fetchone()[0]
        lam_total = conn.execute("SELECT COUNT(*) FROM lambda_functions").fetchone()[0]
    finally:
        conn.close()

    score = 100
    # Per-instance deductions with aggressive caps to keep score realistic
    ec2_idle_pct  = ec2_idle / max(ec2_total, 1) * 100   # % of fleet that's idle
    ec2_under_pct = ec2_under / max(ec2_total, 1) * 100
    s3_cold_pct   = s3_cold / max(s3_total, 1) * 100
    rds_idle_pct  = rds_idle / max(rds_total, 1) * 100
    rds_under_pct = rds_under / max(rds_total, 1) * 100
    lam_over_pct  = lam_over / max(lam_total, 1) * 100

    ec2_ded  = min(ec2_idle_pct * 0.2 + ec2_under_pct * 0.05, 12)
    s3_ded   = min(s3_cold_pct * 0.08, 8)
    rds_ded  = min(rds_idle_pct * 0.15 + rds_under_pct * 0.05, 10)
    lam_ded  = min(lam_over_pct * 0.05, 6)
    anom_ded = min(anomaly_count * 1.5, 8)
    score -= ec2_ded + s3_ded + rds_ded + lam_ded + anom_ded
    score = max(0, min(100, round(score)))

    return {
        "score": score,
        "status": _status_label(score),
        "breakdown": {
            "ec2": {
                "label": "EC2 Compute Efficiency",
                "idle_instances": ec2_idle,
                "underutilized_instances": ec2_under,
                "deduction": ec2_ded,
            },
            "s3": {
                "label": "S3 Storage Efficiency",
                "cold_buckets": s3_cold,
                "deduction": s3_ded,
            },
            "rds": {
                "label": "RDS Database Health",
                "idle_instances": rds_idle,
                "underutilized_instances": rds_under,
                "deduction": rds_ded,
            },
            "lambda": {
                "label": "Lambda Efficiency",
                "over_allocated_functions": lam_over,
                "deduction": lam_ded,
            },
            "anomalies": {
                "label": "Cost Anomaly Health",
                "anomalies_detected": anomaly_count,
                "deduction": anom_ded,
            },
        },
        "total_resources_analyzed": ec2_total + s3_total + rds_total + lam_total,
    }
