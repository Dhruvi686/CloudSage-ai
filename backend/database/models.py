"""
SQLAlchemy ORM models for CloudSage AI.
Each table mirrors its corresponding CSV dataset schema.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from database.database import Base


class EC2Resource(Base):
    __tablename__ = "ec2_resources"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(String, unique=True, index=True, nullable=False)
    instance_type = Column(String, nullable=False)
    cpu_usage = Column(Float, nullable=False)         # percentage
    memory_usage = Column(Float, nullable=False)      # percentage
    monthly_cost = Column(Float, nullable=False)      # USD
    region = Column(String, nullable=False)
    hours_running = Column(Integer, default=744)
    environment = Column(String, default="production")
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())


class S3Bucket(Base):
    __tablename__ = "s3_buckets"

    id = Column(Integer, primary_key=True, index=True)
    bucket_name = Column(String, unique=True, index=True, nullable=False)
    size_gb = Column(Float, nullable=False)
    last_access_days = Column(Integer, nullable=False)  # days since last access
    monthly_cost = Column(Float, nullable=False)        # USD
    storage_class = Column(String, default="STANDARD")
    region = Column(String, nullable=False)
    object_count = Column(Integer, default=0)
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())


class RDSInstance(Base):
    __tablename__ = "rds_instances"

    id = Column(Integer, primary_key=True, index=True)
    db_name = Column(String, unique=True, index=True, nullable=False)
    instance_type = Column(String, nullable=False)
    connections = Column(Integer, nullable=False)
    cpu_usage = Column(Float, nullable=False)       # percentage
    monthly_cost = Column(Float, nullable=False)    # USD
    region = Column(String, nullable=False)
    storage_gb = Column(Integer, default=100)
    environment = Column(String, default="production")
    engine = Column(String, default="postgres")
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())


class LambdaFunction(Base):
    __tablename__ = "lambda_functions"

    id = Column(Integer, primary_key=True, index=True)
    function_name = Column(String, unique=True, index=True, nullable=False)
    memory_allocated_mb = Column(Integer, nullable=False)
    memory_used_mb = Column(Integer, nullable=False)
    invocations = Column(Integer, nullable=False)
    monthly_cost = Column(Float, nullable=False)    # USD
    region = Column(String, nullable=False)
    avg_duration_ms = Column(Integer, default=200)
    environment = Column(String, default="production")
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())


class CostHistory(Base):
    __tablename__ = "cost_history"

    id = Column(Integer, primary_key=True, index=True)
    month_index = Column(Integer, nullable=False)   # 1–12 for ML indexing
    month_label = Column(String, nullable=False)    # "Jan", "Feb" ...
    year = Column(Integer, nullable=False)
    total_cost = Column(Float, nullable=False)
    ec2_cost = Column(Float, nullable=False)
    s3_cost = Column(Float, nullable=False)
    rds_cost = Column(Float, nullable=False)
    lambda_cost = Column(Float, nullable=False)
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(String, nullable=False, index=True)
    service = Column(String, nullable=False)        # EC2 | S3 | RDS | Lambda
    recommendation = Column(String, nullable=False)
    reason = Column(String, nullable=False)
    business_impact = Column(String, nullable=False)
    monthly_savings = Column(Float, nullable=False)
    priority = Column(String, nullable=False)       # High | Medium | Low
    confidence = Column(Integer, nullable=False)    # 0–100
    status = Column(String, default="pending")      # pending | accepted | dismissed
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    service = Column(String, nullable=False)
    resource_id = Column(String, nullable=True)
    message = Column(String, nullable=False)
    severity = Column(String, nullable=False)       # High | Medium | Low
    detected_at = Column(DateTime(timezone=True), server_default=func.now())
