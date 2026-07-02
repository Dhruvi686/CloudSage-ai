"""
Database module — CloudSage AI
Uses Python's built-in sqlite3 (no SQLAlchemy needed).
Provides a simple connection factory and table initialisation.
"""

import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "..", "cloudsage.db")

# ── DDL statements ──────────────────────────────────────────────────────────

CREATE_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS ec2_resources (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    resource_id      TEXT    UNIQUE NOT NULL,
    instance_type    TEXT    NOT NULL,
    cpu_usage        REAL    NOT NULL,
    memory_usage     REAL    NOT NULL,
    monthly_cost     REAL    NOT NULL,
    region           TEXT    NOT NULL,
    hours_running    INTEGER DEFAULT 744,
    environment      TEXT    DEFAULT 'production'
);

CREATE TABLE IF NOT EXISTS s3_buckets (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    bucket_name      TEXT    UNIQUE NOT NULL,
    size_gb          REAL    NOT NULL,
    last_access_days INTEGER NOT NULL,
    monthly_cost     REAL    NOT NULL,
    storage_class    TEXT    DEFAULT 'STANDARD',
    region           TEXT    NOT NULL,
    object_count     INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rds_instances (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    db_name          TEXT    UNIQUE NOT NULL,
    instance_type    TEXT    NOT NULL,
    connections      INTEGER NOT NULL,
    cpu_usage        REAL    NOT NULL,
    monthly_cost     REAL    NOT NULL,
    region           TEXT    NOT NULL,
    storage_gb       INTEGER DEFAULT 100,
    environment      TEXT    DEFAULT 'production',
    engine           TEXT    DEFAULT 'postgres'
);

CREATE TABLE IF NOT EXISTS lambda_functions (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    function_name        TEXT    UNIQUE NOT NULL,
    memory_allocated_mb  INTEGER NOT NULL,
    memory_used_mb       INTEGER NOT NULL,
    invocations          INTEGER NOT NULL,
    monthly_cost         REAL    NOT NULL,
    region               TEXT    NOT NULL,
    avg_duration_ms      INTEGER DEFAULT 200,
    environment          TEXT    DEFAULT 'production'
);

CREATE TABLE IF NOT EXISTS cost_history (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    month_index  INTEGER NOT NULL,
    month_label  TEXT    NOT NULL,
    year         INTEGER NOT NULL,
    total_cost   REAL    NOT NULL,
    ec2_cost     REAL    DEFAULT 0,
    s3_cost      REAL    DEFAULT 0,
    rds_cost     REAL    DEFAULT 0,
    lambda_cost  REAL    DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ec2_resource ON ec2_resources(resource_id);
CREATE INDEX IF NOT EXISTS idx_s3_bucket ON s3_buckets(bucket_name);
CREATE INDEX IF NOT EXISTS idx_rds_db ON rds_instances(db_name);
CREATE INDEX IF NOT EXISTS idx_lambda_func ON lambda_functions(function_name);
"""


def get_connection() -> sqlite3.Connection:
    """Return a sqlite3 connection with row_factory set for dict-like access."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create all tables if they don't exist. Called once at startup."""
    conn = get_connection()
    try:
        conn.executescript(CREATE_TABLES_SQL)
        conn.commit()
    finally:
        conn.close()
