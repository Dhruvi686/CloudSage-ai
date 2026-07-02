"""
Upload Route — CloudSage AI (sqlite3 version)
POST /api/upload
"""

import io
import csv
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from database.database import get_connection

router = APIRouter()

# Define required fields and their possible aliases in native AWS exports
SCHEMA_ALIASES = {
    "ec2": {
        "resource_id": {"resource_id", "InstanceArn"},
        "instance_type": {"instance_type", "CurrentInstanceType"},
        "cpu_usage": {"cpu_usage", "UtilizationMetricsCpuMaximum"},
        "memory_usage": {"memory_usage", "UtilizationMetricsMemoryMaximum"},
        "monthly_cost": {"monthly_cost", "CurrentPrice", "CurrentOnDemandPrice"},
    },
    "s3": {
        "bucket_name": {"bucket_name", "Bucket", "record_value"},
        "size_gb": {"size_gb", "StorageBytes"},
        "last_access_days": {"last_access_days", "UnaccessedObjectDays"},
        "monthly_cost": {"monthly_cost", "UnblendedCost", "metric_value"},
    },
    "rds": {
        "db_name": {"db_name"},
        "instance_type": {"instance_type"},
        "connections": {"connections"},
        "cpu_usage": {"cpu_usage"},
        "monthly_cost": {"monthly_cost"},
    },
    "lambda": {
        "function_name": {"function_name"},
        "memory_allocated_mb": {"memory_allocated_mb"},
        "memory_used_mb": {"memory_used_mb"},
        "monthly_cost": {"monthly_cost"},
    },
}

TABLE_MAP = {
    "ec2":    "ec2_resources",
    "s3":     "s3_buckets",
    "rds":    "rds_instances",
    "lambda": "lambda_functions",
}

def _detect(cols: set) -> tuple[str | None, dict]:
    for ds_name, required_fields in SCHEMA_ALIASES.items():
        mapping = {}
        # Try to find a matching column for each required field
        is_match = True
        for field, aliases in required_fields.items():
            found = False
            for col in cols:
                if col in aliases:
                    mapping[field] = col
                    found = True
                    break
            if not found:
                is_match = False
                break
        
        if is_match:
            return ds_name, mapping
            
    return None, {}


def safe_float(v: str) -> float:
    if not v:
        return 0.0
    v = str(v).replace(',', '').strip()
    if v.lower() in ('na', 'n/a', 'nan', 'null', 'none', '-'):
        return 0.0
    try:
        # Strip currency symbols if present
        v = v.replace('$', '').replace('€', '').replace('£', '')
        return float(v)
    except ValueError:
        return 0.0

def safe_int(v: str) -> int:
    return int(safe_float(v))
@router.post("/upload", summary="Upload a CSV dataset", tags=["Data Ingestion"])
async def upload_csv(file: UploadFile = File(...)):
    if not (file.filename or "").endswith(".csv"):
        raise HTTPException(400, "Only .csv files are accepted.")
    contents = await file.read()
    try:
        text = contents.decode("utf-8")
        reader = csv.DictReader(io.StringIO(text))
        rows = list(reader)
    except Exception as e:
        raise HTTPException(422, f"Failed to parse CSV: {e}")

    if not rows:
        raise HTTPException(422, "Uploaded CSV is empty.")

    dtype, mapping = _detect(set(rows[0].keys()))
    if dtype is None:
        raise HTTPException(422, f"Unrecognised dataset. Columns: {list(rows[0].keys())}")

    conn = get_connection()
    count = 0
    try:
        conn.execute("BEGIN TRANSACTION")
        conn.execute(f"DELETE FROM {TABLE_MAP[dtype]}")
        
        # Pre-validate rows before insertion
        valid_rows = []
        for r in rows:
            # We skip entirely empty rows
            if not any(r.values()):
                continue
            valid_rows.append(r)
            
        if not valid_rows:
            raise HTTPException(422, "No valid data rows found in CSV.")

        if dtype == "ec2":
            conn.executemany(
                "INSERT INTO ec2_resources (resource_id,instance_type,cpu_usage,memory_usage,monthly_cost,region,hours_running,environment) VALUES (?,?,?,?,?,?,?,?)",
                [(r[mapping["resource_id"]].split("instance/")[-1] if "instance/" in r[mapping["resource_id"]] else r[mapping["resource_id"]], 
                  r[mapping["instance_type"]], 
                  safe_float(r[mapping["cpu_usage"]]), 
                  safe_float(r[mapping["memory_usage"]]),
                  safe_float(r[mapping["monthly_cost"]]), 
                  r.get("region", "us-east-1"), 
                  safe_int(r.get("hours_running") or 744),
                  r.get("environment", "production")) for r in valid_rows]
            )
        elif dtype == "s3":
            def get_gb(r):
                # Convert bytes to GB if it came from native AWS StorageBytes
                val = safe_float(r[mapping["size_gb"]])
                return val / (1024**3) if mapping["size_gb"] == "StorageBytes" else val
                
            conn.executemany(
                "INSERT INTO s3_buckets (bucket_name,size_gb,last_access_days,monthly_cost,storage_class,region,object_count) VALUES (?,?,?,?,?,?,?)",
                [(r[mapping["bucket_name"]], 
                  get_gb(r), 
                  safe_int(r[mapping["last_access_days"]]),
                  safe_float(r[mapping["monthly_cost"]]), 
                  r.get("storage_class","STANDARD"),
                  r.get("region","us-east-1"), 
                  safe_int(r.get("object_count") or 0)) for r in valid_rows]
            )
        elif dtype == "rds":
            conn.executemany(
                "INSERT INTO rds_instances (db_name,instance_type,connections,cpu_usage,monthly_cost,region,storage_gb,environment,engine) VALUES (?,?,?,?,?,?,?,?,?)",
                [(r[mapping["db_name"]], r[mapping["instance_type"]], safe_int(r[mapping["connections"]]),
                  safe_float(r[mapping["cpu_usage"]]), safe_float(r[mapping["monthly_cost"]]), r.get("region","us-east-1"),
                  safe_int(r.get("storage_gb") or 100), r.get("environment","production"),
                  r.get("engine","postgres")) for r in valid_rows]
            )
        elif dtype == "lambda":
            conn.executemany(
                "INSERT INTO lambda_functions (function_name,memory_allocated_mb,memory_used_mb,invocations,monthly_cost,region,avg_duration_ms,environment) VALUES (?,?,?,?,?,?,?,?)",
                [(r[mapping["function_name"]], safe_int(r[mapping["memory_allocated_mb"]]), safe_int(r[mapping["memory_used_mb"]]),
                  safe_int(r.get("invocations", 0)), safe_float(r[mapping["monthly_cost"]]), r.get("region","us-east-1"),
                  safe_int(r.get("avg_duration_ms") or 200), r.get("environment","production")) for r in valid_rows]
            )
        conn.commit()
        count = len(valid_rows)
    except Exception as e:
        conn.rollback()
        raise HTTPException(500, f"Database error: {e}")
    finally:
        conn.close()

    return JSONResponse({"status": "success", "dataset": dtype, "rows_inserted": count,
                         "message": f"Successfully uploaded {count} {dtype.upper()} records."})
