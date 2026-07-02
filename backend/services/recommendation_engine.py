"""
Recommendation Engine — CloudSage AI
Pure rule-based FinOps intelligence engine.
Uses sqlite3 directly — no ORM dependency.
"""

import sqlite3
from database.database import get_connection

_EC2_DOWNSIZE_MAP = {
    "m5.4xlarge":  ("m5.2xlarge", 339.00),
    "m5.2xlarge":  ("m5.xlarge",  185.00),
    "m5.xlarge":   ("m5.large",    70.08),
    "m5.large":    ("t3.large",    60.74),
    "c5.4xlarge":  ("c5.2xlarge", 244.00),
    "c5.2xlarge":  ("c5.xlarge",  122.00),
    "c5.xlarge":   ("c5.large",    61.00),
    "c5.large":    ("t3.medium",   30.37),
    "r5.2xlarge":  ("r5.xlarge",  190.08),
    "r5.xlarge":   ("r5.large",   120.96),
    "r5.large":    ("t3.large",    60.74),
    "t3.xlarge":   ("t3.large",    60.74),
    "t3.large":    ("t3.medium",   30.37),
    "t3.medium":   ("t3.small",    15.18),
    "t3.micro":    ("t3.nano",      4.75),
}

_RDS_DOWNSIZE_MAP = {
    "db.r5.2xlarge":  ("db.r5.xlarge",   405.00),
    "db.r5.xlarge":   ("db.r5.large",    210.00),
    "db.r5.large":    ("db.m5.large",    175.00),
    "db.m5.2xlarge":  ("db.m5.xlarge",   225.00),
    "db.m5.xlarge":   ("db.m5.large",    175.00),
    "db.m5.large":    ("db.m5.medium",   100.00),
    "db.m5.medium":   ("db.t3.medium",    60.00),
    "db.t3.medium":   ("db.t3.small",     35.00),
    "db.t3.small":    ("db.t3.micro",     15.00),
}


def _rows(conn: sqlite3.Connection, sql: str, params=()) -> list[dict]:
    cur = conn.execute(sql, params)
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]


def _analyze_ec2(conn) -> list[dict]:
    resources = _rows(conn, "SELECT * FROM ec2_resources")
    recs = []
    for r in resources:
        cpu = r["cpu_usage"]
        cost = r["monthly_cost"]
        itype = r["instance_type"]
        if cpu < 10:
            savings = round(cost * 0.95, 2)
            recs.append({
                "resource_id": r["resource_id"],
                "service": "EC2",
                "recommendation": f"Terminate idle instance (currently {itype})",
                "reason": f"Average CPU usage is only {cpu}% — well below the 10% idle threshold. "
                          f"Instance has been running {r['hours_running']} hours with negligible workload.",
                "business_impact": "Zero production impact expected. Terminating this instance will save "
                                   f"${savings}/month immediately. Consider Spot Instances if workload resumes.",
                "monthly_savings": savings,
                "priority": "High",
                "confidence": 95,
                "current_value": f"{cpu}% avg CPU",
            })
        elif cpu < 30:
            target = _EC2_DOWNSIZE_MAP.get(itype)
            if target:
                target_type, target_cost = target
                savings = round(cost - target_cost, 2)
            else:
                target_type = f"Smaller {itype.split('.')[0]} instance" if '.' in itype else "Smaller instance"
                target_cost = round(cost * 0.5, 2)
                savings = round(cost * 0.5, 2)
                
            if savings > 0:
                    recs.append({
                        "resource_id": r["resource_id"],
                        "service": "EC2",
                        "recommendation": f"Resize from {itype} → {target_type}",
                        "reason": f"CPU utilization averaged {cpu}% over 30 days. "
                                  f"A {target_type} provides sufficient capacity for this workload.",
                        "business_impact": f"Downsizing to {target_type} maintains performance headroom while "
                                           f"reducing monthly cost from ${cost} to ${target_cost}.",
                        "monthly_savings": savings,
                        "priority": "Medium",
                        "confidence": 88,
                        "current_value": f"{cpu}% avg CPU",
                    })
    return recs


def _analyze_s3(conn) -> list[dict]:
    buckets = _rows(conn, "SELECT * FROM s3_buckets")
    recs = []
    for b in buckets:
        if b["last_access_days"] > 90:
            savings = round(b["monthly_cost"] * 0.70, 2)
            priority = "High" if b["last_access_days"] > 180 else "Medium"
            recs.append({
                "resource_id": b["bucket_name"],
                "service": "S3",
                "recommendation": "Move to S3 Glacier Instant Retrieval",
                "reason": f"Bucket '{b['bucket_name']}' ({b['size_gb']:.1f} GB) has not been accessed "
                          f"in {b['last_access_days']} days. Data is cold and eligible for archival.",
                "business_impact": f"Glacier Instant Retrieval costs ~70% less than Standard S3. "
                                   f"Objects remain instantly retrievable within milliseconds. "
                                   f"Estimated saving: ${savings}/month.",
                "monthly_savings": savings,
                "priority": priority,
                "confidence": 90,
                "current_value": f"{b['last_access_days']} days since last access",
            })
    return recs


def _analyze_rds(conn) -> list[dict]:
    instances = _rows(conn, "SELECT * FROM rds_instances")
    recs = []
    for d in instances:
        conns = d["connections"]
        cost = d["monthly_cost"]
        itype = d["instance_type"]
        if conns == 0:
            savings = round(cost * 0.90, 2)
            recs.append({
                "resource_id": d["db_name"],
                "service": "RDS",
                "recommendation": "Stop or terminate idle RDS instance",
                "reason": f"Database '{d['db_name']}' has had zero active connections. "
                          f"Instance is running at {d['cpu_usage']}% CPU with no workload.",
                "business_impact": "Stopping this instance recovers 90% of monthly cost. "
                                   "Snapshots are retained. Instance can be restarted within minutes.",
                "monthly_savings": savings,
                "priority": "High",
                "confidence": 97,
                "current_value": f"{conns} connections",
            })
        elif conns < 20:
            target = _RDS_DOWNSIZE_MAP.get(itype)
            if target:
                target_type, target_cost = target
                savings = round(cost - target_cost, 2)
            else:
                target_type = "Smaller instance"
                target_cost = round(cost * 0.5, 2)
                savings = round(cost * 0.5, 2)
                
            if savings > 0:
                    recs.append({
                        "resource_id": d["db_name"],
                        "service": "RDS",
                        "recommendation": f"Downsize from {itype} → {target_type}",
                        "reason": f"Only {conns} concurrent connections with {d['cpu_usage']}% CPU. "
                                  f"Instance is significantly over-provisioned.",
                        "business_impact": f"Smaller instance handles up to ~50 connections comfortably. "
                                           f"Monthly cost drops from ${cost} to ${target_cost}.",
                        "monthly_savings": savings,
                        "priority": "Low",
                        "confidence": 82,
                        "current_value": f"{conns} connections",
                    })
    return recs


def _analyze_lambda(conn) -> list[dict]:
    functions = _rows(conn, "SELECT * FROM lambda_functions")
    recs = []
    for fn in functions:
        alloc = fn["memory_allocated_mb"]
        used = fn["memory_used_mb"]
        if alloc == 0:
            continue
        mem_pct = (used / alloc) * 100
        if mem_pct < 40:
            optimal_mb = max(128, round(used * 2))
            savings_factor = 1 - (optimal_mb / alloc)
            savings = round(fn["monthly_cost"] * savings_factor, 2)
            if savings < 0.50:
                continue
            recs.append({
                "resource_id": fn["function_name"],
                "service": "Lambda",
                "recommendation": f"Reduce memory from {alloc} MB → {optimal_mb} MB",
                "reason": f"Function only uses {used} MB ({mem_pct:.1f}%) of its {alloc} MB allocation. "
                          f"Lambda pricing is linear with memory.",
                "business_impact": f"Reducing to {optimal_mb} MB saves ~{round(savings_factor * 100)}% on "
                                   f"compute cost. Execution time stays the same for memory-bound functions.",
                "monthly_savings": savings,
                "priority": "Low",
                "confidence": 85,
                "current_value": f"{mem_pct:.1f}% memory utilization",
            })
    return recs


def generate_recommendations() -> list[dict]:
    """Run all FinOps rules. Returns a unified sorted list of recommendations."""
    conn = get_connection()
    try:
        all_recs = []
        all_recs.extend(_analyze_ec2(conn))
        all_recs.extend(_analyze_s3(conn))
        all_recs.extend(_analyze_rds(conn))
        all_recs.extend(_analyze_lambda(conn))
    finally:
        conn.close()

    priority_order = {"High": 0, "Medium": 1, "Low": 2}
    all_recs.sort(key=lambda x: (priority_order.get(x["priority"], 3), -x["monthly_savings"]))
    return all_recs


def get_recommendations_summary() -> dict:
    """High-level savings totals by service."""
    recs = generate_recommendations()
    total_monthly = sum(r["monthly_savings"] for r in recs)
    by_service: dict[str, float] = {}
    for r in recs:
        by_service[r["service"]] = by_service.get(r["service"], 0) + r["monthly_savings"]
    return {
        "total_recommendations": len(recs),
        "total_monthly_savings": round(total_monthly, 2),
        "total_annual_savings": round(total_monthly * 12, 2),
        "by_service": {k: round(v, 2) for k, v in by_service.items()},
        "high_priority_count": sum(1 for r in recs if r["priority"] == "High"),
        "medium_priority_count": sum(1 for r in recs if r["priority"] == "Medium"),
        "low_priority_count": sum(1 for r in recs if r["priority"] == "Low"),
    }
