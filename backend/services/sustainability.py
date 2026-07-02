"""
Sustainability Score — CloudSage AI
Uses sqlite3 directly — no ORM dependency.
"""

from database.database import get_connection

REGION_CARBON_INTENSITY = {
    "us-east-1": 415, "us-east-2": 420, "us-west-1": 210, "us-west-2": 110,
    "eu-west-1": 82,  "eu-west-2": 225, "eu-central-1": 350,
    "ap-southeast-1": 490, "ap-northeast-1": 480, "ap-south-1": 710,
    "ca-central-1": 40, "sa-east-1": 74,
}
DEFAULT_CARBON = 420

INSTANCE_POWER_W = {
    "t3.micro": 5, "t3.nano": 3, "t3.small": 8, "t3.medium": 12, "t3.large": 18,
    "t3.xlarge": 30, "t3.2xlarge": 55, "m5.large": 20, "m5.xlarge": 38,
    "m5.2xlarge": 70, "m5.4xlarge": 135, "c5.large": 22, "c5.xlarge": 40,
    "c5.2xlarge": 78, "c5.4xlarge": 150, "r5.large": 25, "r5.xlarge": 48,
    "r5.2xlarge": 90,
}
DEFAULT_POWER_W = 50


def _rows(conn, sql: str) -> list[dict]:
    cur = conn.execute(sql)
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]


def _status_label(score: int) -> str:
    if score >= 85: return "Excellent"
    if score >= 70: return "Good"
    if score >= 55: return "Fair"
    return "Needs Improvement"


def compute_sustainability_score() -> dict:
    conn = get_connection()
    try:
        ec2 = _rows(conn, "SELECT * FROM ec2_resources")
        s3  = _rows(conn, "SELECT * FROM s3_buckets")
        lam = _rows(conn, "SELECT * FROM lambda_functions")
    finally:
        conn.close()

    # 1. Resource efficiency
    if ec2:
        avg_cpu = sum(r["cpu_usage"] for r in ec2) / len(ec2)
        if avg_cpu >= 60:
            resource_eff = min(100, avg_cpu * 1.1)
        elif avg_cpu >= 30:
            resource_eff = 55 + ((avg_cpu - 30) / 30) * 30
        else:
            resource_eff = 20 + avg_cpu * 1.2
        resource_eff = min(100, resource_eff)
    else:
        avg_cpu, resource_eff = 0, 50.0

    # 2. Storage efficiency
    if s3:
        cold = [b for b in s3 if b["last_access_days"] > 90 and b["storage_class"] == "STANDARD"]
        storage_eff = max(0, 100 - (len(cold) / len(s3)) * 100)
    else:
        cold, storage_eff = [], 100.0

    # 3. Regional carbon score
    if ec2:
        total_cost = sum(r["monthly_cost"] for r in ec2) or 1
        weighted_carbon = sum(
            REGION_CARBON_INTENSITY.get(r["region"], DEFAULT_CARBON) * r["monthly_cost"] for r in ec2
        ) / total_cost
        carbon_score = max(0, 100 - ((weighted_carbon - 40) / (710 - 40)) * 100)
    else:
        weighted_carbon, carbon_score = DEFAULT_CARBON, 50.0

    # 4. Lambda efficiency
    if lam:
        utils = [(f["memory_used_mb"] / f["memory_allocated_mb"]) * 100
                 for f in lam if f["memory_allocated_mb"] > 0]
        avg_lambda_util = sum(utils) / len(utils) if utils else 50
        lambda_eff = min(100, avg_lambda_util * 1.5)
    else:
        avg_lambda_util, lambda_eff = 0, 50.0

    score = int(resource_eff * 0.35 + storage_eff * 0.25 + carbon_score * 0.25 + lambda_eff * 0.15)
    score = max(0, min(100, score))

    # CO₂ estimate
    monthly_kwh = sum(
        (INSTANCE_POWER_W.get(r["instance_type"], DEFAULT_POWER_W)
         * (0.3 + r["cpu_usage"] / 100 * 0.7)
         * r["hours_running"]) / 1000
        for r in ec2
    )
    monthly_kwh_pue = monthly_kwh * 1.2
    monthly_co2_kg  = (monthly_kwh_pue * weighted_carbon) / 1000
    annual_co2_tons = round(monthly_co2_kg * 12 / 1000, 2)
    co2_reduction   = round(annual_co2_tons - annual_co2_tons * (score / 100), 2)

    return {
        "score": score,
        "status": _status_label(score),
        "co2_reduction_estimate": f"{co2_reduction} tons/year",
        "annual_co2_estimate_tons": annual_co2_tons,
        "monthly_kwh_estimate": round(monthly_kwh_pue, 1),
        "efficiency_breakdown": {
            "resource_efficiency": round(resource_eff, 1),
            "storage_efficiency": round(storage_eff, 1),
            "regional_carbon_score": round(carbon_score, 1),
            "lambda_efficiency": round(lambda_eff, 1),
        },
        "fleet_summary": {
            "avg_cpu_utilization": round(avg_cpu, 1),
            "avg_weighted_carbon_intensity": round(weighted_carbon, 0),
            "cold_s3_buckets": len(cold),
            "over_allocated_lambdas": sum(
                1 for f in lam
                if f["memory_allocated_mb"] > 0
                and (f["memory_used_mb"] / f["memory_allocated_mb"]) < 0.40
            ),
        },
    }
