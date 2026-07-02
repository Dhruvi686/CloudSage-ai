"""
Forecast Route — CloudSage AI (sqlite3 version)
"""

from fastapi import APIRouter, Query
from services.forecasting import run_forecast, run_simulation

router = APIRouter()


@router.get("/forecast", summary="ML-powered cost forecast", tags=["Forecasting"])
def get_forecast():
    return run_forecast()


@router.get("/forecast/simulate", summary="What-if simulation", tags=["Forecasting"])
def get_simulation(
    reserved_pct: float = Query(40.0, ge=0, le=100),
    storage_tier: int = Query(1, ge=0, le=2),
    idle_cleanup_pct: float = Query(35.0, ge=0, le=100),
):
    return run_simulation(reserved_pct, storage_tier, idle_cleanup_pct)
