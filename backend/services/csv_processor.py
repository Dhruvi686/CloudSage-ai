"""
CSV Processor — CloudSage AI
Reads all mock datasets, validates schema, and bulk-inserts into SQLite.
Uses built-in sqlite3. Called once at FastAPI startup.
"""

import os
import csv
from database.database import get_connection

DATASETS_DIR = os.path.join(os.path.dirname(__file__), "..", "datasets")

REQUIRED_COLUMNS = {
    "ec2":          {"resource_id", "instance_type", "cpu_usage", "memory_usage", "monthly_cost", "region"},
    "s3":           {"bucket_name", "size_gb", "last_access_days", "monthly_cost"},
    "rds":          {"db_name", "instance_type", "connections", "cpu_usage", "monthly_cost"},
    "lambda":       {"function_name", "memory_allocated_mb", "memory_used_mb", "monthly_cost"},
    "cost_history": {"month_index", "month_label", "year", "total_cost"},
}


def _read_csv(filename: str) -> list[dict]:
    path = os.path.join(DATASETS_DIR, filename)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Dataset not found: {path}")
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def _validate(rows: list[dict], key: str) -> None:
    if not rows:
        raise ValueError(f"[{key}] CSV is empty.")
    cols = set(rows[0].keys())
    missing = REQUIRED_COLUMNS[key] - cols
    if missing:
        raise ValueError(f"[{key}] Missing columns: {missing}")


def _count(conn, table: str) -> int:
    return conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]


def _load_ec2(conn) -> int:
    if _count(conn, "ec2_resources") > 0:
        return 0
    rows = _read_csv("ec2.csv")
    _validate(rows, "ec2")
    conn.executemany(
        """INSERT OR IGNORE INTO ec2_resources
           (resource_id, instance_type, cpu_usage, memory_usage, monthly_cost, region, hours_running, environment)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        [(r["resource_id"], r["instance_type"], float(r["cpu_usage"]),
          float(r["memory_usage"]), float(r["monthly_cost"]), r["region"],
          int(r.get("hours_running") or 744), r.get("environment", "production"))
         for r in rows]
    )
    return len(rows)


def _load_s3(conn) -> int:
    if _count(conn, "s3_buckets") > 0:
        return 0
    rows = _read_csv("s3.csv")
    _validate(rows, "s3")
    conn.executemany(
        """INSERT OR IGNORE INTO s3_buckets
           (bucket_name, size_gb, last_access_days, monthly_cost, storage_class, region, object_count)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        [(r["bucket_name"], float(r["size_gb"]), int(r["last_access_days"]),
          float(r["monthly_cost"]), r.get("storage_class", "STANDARD"),
          r.get("region", "us-east-1"), int(r.get("object_count") or 0))
         for r in rows]
    )
    return len(rows)


def _load_rds(conn) -> int:
    if _count(conn, "rds_instances") > 0:
        return 0
    rows = _read_csv("rds.csv")
    _validate(rows, "rds")
    conn.executemany(
        """INSERT OR IGNORE INTO rds_instances
           (db_name, instance_type, connections, cpu_usage, monthly_cost, region, storage_gb, environment, engine)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [(r["db_name"], r["instance_type"], int(r["connections"]),
          float(r["cpu_usage"]), float(r["monthly_cost"]), r.get("region", "us-east-1"),
          int(r.get("storage_gb") or 100), r.get("environment", "production"),
          r.get("engine", "postgres"))
         for r in rows]
    )
    return len(rows)


def _load_lambda(conn) -> int:
    if _count(conn, "lambda_functions") > 0:
        return 0
    rows = _read_csv("lambda.csv")
    _validate(rows, "lambda")
    conn.executemany(
        """INSERT OR IGNORE INTO lambda_functions
           (function_name, memory_allocated_mb, memory_used_mb, invocations, monthly_cost, region, avg_duration_ms, environment)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        [(r["function_name"], int(r["memory_allocated_mb"]), int(r["memory_used_mb"]),
          int(r["invocations"]), float(r["monthly_cost"]), r.get("region", "us-east-1"),
          int(r.get("avg_duration_ms") or 200), r.get("environment", "production"))
         for r in rows]
    )
    return len(rows)


def _load_cost_history(conn) -> int:
    if _count(conn, "cost_history") > 0:
        return 0
    rows = _read_csv("cost_history.csv")
    _validate(rows, "cost_history")
    conn.executemany(
        """INSERT INTO cost_history
           (month_index, month_label, year, total_cost, ec2_cost, s3_cost, rds_cost, lambda_cost)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        [(int(r["month_index"]), r["month_label"], int(r["year"]),
          float(r["total_cost"]), float(r.get("ec2_cost") or 0),
          float(r.get("s3_cost") or 0), float(r.get("rds_cost") or 0),
          float(r.get("lambda_cost") or 0))
         for r in rows]
    )
    return len(rows)


def load_all_datasets() -> dict:
    """
    Load all datasets into SQLite. Idempotent — skips populated tables.
    Returns summary of rows inserted per dataset.
    """
    conn = get_connection()
    summary = {}
    try:
        summary["ec2"] = _load_ec2(conn)
        summary["s3"] = _load_s3(conn)
        summary["rds"] = _load_rds(conn)
        summary["lambda"] = _load_lambda(conn)
        summary["cost_history"] = _load_cost_history(conn)
        conn.commit()
    finally:
        conn.close()
    return summary
