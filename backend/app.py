"""
CloudSage AI — FastAPI Backend Entry Point (sqlite3 version)
No external DB dependency — uses Python's built-in sqlite3.

Start: uvicorn app:app --reload --port 8000
Docs:  http://localhost:8000/docs
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.database import init_db
from routes import upload, dashboard, recommendations, forecast, chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[START] CloudSage AI backend starting...")
    init_db()
    print("[OK] SQLite tables ready.")
    print("[READY] API docs at http://localhost:8000/docs")
    yield
    print("Shutting down.")


app = FastAPI(
    title="CloudSage AI — FinOps Backend API",
    description=(
        "AI-powered Cloud Cost Intelligence platform. "
        "Delivers optimization recommendations, ML-based forecasting, "
        "anomaly detection, FinOps scoring, and sustainability insights.\n\n"
        "**MVP supports:** EC2 · S3 · RDS · Lambda\n\n"
        "**Architecture is extensible** to EBS, DynamoDB, ECS, EKS, CloudFront, "
        "and Redshift without changing the core platform."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router,          prefix="/api")
app.include_router(dashboard.router,       prefix="/api")
app.include_router(recommendations.router, prefix="/api")
app.include_router(forecast.router,        prefix="/api")
app.include_router(chat.router,            prefix="/api")


@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "service": "CloudSage AI Backend", "version": "1.0.0"}
