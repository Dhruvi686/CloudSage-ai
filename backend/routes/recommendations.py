"""
Recommendations Route — CloudSage AI (sqlite3 version)
"""

from fastapi import APIRouter, Query
from services.recommendation_engine import generate_recommendations, get_recommendations_summary

router = APIRouter()


@router.get("/recommendations", summary="Get all optimization recommendations", tags=["Recommendations"])
def get_recommendations(
    service: str | None = Query(None, description="Filter: EC2, S3, RDS, Lambda"),
    priority: str | None = Query(None, description="Filter: High, Medium, Low"),
    limit: int = Query(50, ge=1, le=200),
):
    recs = generate_recommendations()
    if service:
        recs = [r for r in recs if r["service"].lower() == service.lower()]
    if priority:
        recs = [r for r in recs if r["priority"].lower() == priority.lower()]
    return recs[:limit]


@router.get("/recommendations/summary", summary="Get savings summary", tags=["Recommendations"])
def get_rec_summary():
    return get_recommendations_summary()
