"""
Chat Route — CloudSage AI (Rule-based Sage AI Advisor, sqlite3 version)
POST /api/chat/sage
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database.database import get_connection
from services.recommendation_engine import get_recommendations_summary
from services.anomaly_detection import detect_cost_anomalies

router = APIRouter()


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str
    data_context: dict | None = None


def _has(text: str, *kw: str) -> bool:
    return any(k in text for k in kw)


def _fmt(v: float) -> str:
    return f"${v:,.0f}"


def _rows(conn, sql: str) -> list[dict]:
    cur = conn.execute(sql)
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]


def _scalar(conn, sql: str, default=0):
    r = conn.execute(sql).fetchone()
    return r[0] if r and r[0] is not None else default


# ── Answer generators ────────────────────────────────────────────────────────

def _cost_increase(conn) -> tuple[str, dict]:
    history = _rows(conn, "SELECT * FROM cost_history ORDER BY month_index")
    if len(history) < 2:
        return ("Insufficient historical data.", {})
    latest, prev = history[-1], history[-2]
    delta = latest["total_cost"] - prev["total_cost"]
    pct = (delta / prev["total_cost"]) * 100
    changes = {s: latest[f"{s}_cost"] - prev[f"{s}_cost"]
               for s in ["ec2", "s3", "rds", "lambda"]}
    top = max(changes, key=lambda k: abs(changes[k]))
    answer = (
        f"**Cloud costs increased by {_fmt(delta)} ({pct:+.1f}%) in {latest['month_label']} {latest['year']}.**\n\n"
        f"The primary driver was **{top.upper()}**, which grew by {_fmt(changes[top])}. "
        f"Review the Recommendations view for specific actions to address this trend."
    )
    return answer, {"top_service": top.upper(), "delta": delta, "pct_change": round(pct, 1)}


def _savings(conn) -> tuple[str, dict]:
    summary = get_recommendations_summary()
    m, a, h = summary["total_monthly_savings"], summary["total_annual_savings"], summary["high_priority_count"]
    answer = (
        f"**Sage identified {_fmt(m)}/month ({_fmt(a)}/year) in savings** "
        f"across {summary['total_recommendations']} recommendations.\n\n"
        f"**{h} High-Priority actions** can be applied immediately:\n"
    )
    for svc, amt in summary["by_service"].items():
        answer += f"- **{svc}**: {_fmt(amt)}/month\n"
    return answer, summary


def _ec2(conn) -> tuple[str, dict]:
    idle = _scalar(conn, "SELECT COUNT(*) FROM ec2_resources WHERE cpu_usage < 10")
    under = _scalar(conn, "SELECT COUNT(*) FROM ec2_resources WHERE cpu_usage >= 10 AND cpu_usage < 30")
    idle_cost = _scalar(conn, "SELECT SUM(monthly_cost) FROM ec2_resources WHERE cpu_usage < 10")
    answer = (
        f"**EC2 Fleet Analysis:**\n\n"
        f"- **{idle} idle instances** (CPU <10%): {_fmt(idle_cost)}/month — recommend termination\n"
        f"- **{under} underutilized instances** (CPU 10–30%): right-sizing saves ~35%\n\n"
        f"Highest-impact action: terminate the {idle} idle instances first."
    )
    return answer, {"idle_count": idle, "under_count": under}


def _s3(conn) -> tuple[str, dict]:
    cold = _scalar(conn, "SELECT COUNT(*) FROM s3_buckets WHERE last_access_days > 90")
    cold_gb = _scalar(conn, "SELECT SUM(size_gb) FROM s3_buckets WHERE last_access_days > 90")
    cold_cost = _scalar(conn, "SELECT SUM(monthly_cost) FROM s3_buckets WHERE last_access_days > 90")
    savings = cold_cost * 0.70
    answer = (
        f"**S3 Storage Analysis:**\n\n"
        f"- **{cold} buckets** ({cold_gb:,.0f} GB) not accessed in 90+ days\n"
        f"- Current cost: {_fmt(cold_cost)}/month in Standard storage\n"
        f"- Moving to **Glacier Instant Retrieval** saves ~70%: {_fmt(savings)}/month\n\n"
        f"Objects remain retrievable in milliseconds at a fraction of Standard pricing."
    )
    return answer, {"cold_buckets": cold, "potential_savings": round(savings, 2)}


def _rds(conn) -> tuple[str, dict]:
    idle = _scalar(conn, "SELECT COUNT(*) FROM rds_instances WHERE connections < 5")
    under = _scalar(conn, "SELECT COUNT(*) FROM rds_instances WHERE connections >= 5 AND connections < 20")
    idle_cost = _scalar(conn, "SELECT SUM(monthly_cost) FROM rds_instances WHERE connections < 5")
    answer = (
        f"**RDS Database Analysis:**\n\n"
        f"- **{idle} idle instances** (<5 connections): {_fmt(idle_cost * 0.9)}/month recoverable\n"
        f"- **{under} underutilized instances** (5–20 connections): right-sizing saves ~30%\n\n"
        f"Stopped RDS instances retain snapshots and can be restarted in under 60 seconds."
    )
    return answer, {"idle_count": idle, "under_count": under}


def _lam(conn) -> tuple[str, dict]:
    over = _scalar(conn,
        "SELECT COUNT(*) FROM lambda_functions WHERE memory_allocated_mb > 0 "
        "AND CAST(memory_used_mb AS REAL)/memory_allocated_mb < 0.4")
    answer = (
        f"**Lambda Optimization:**\n\n"
        f"- **{over} functions** use <40% of their allocated memory\n"
        f"- Lambda pricing is **linearly proportional to memory × duration**\n\n"
        f"Right-sizing to 2× actual peak usage reduces cost proportionally "
        f"with zero impact on execution time."
    )
    return answer, {"over_allocated": over}


def _anomaly(conn) -> tuple[str, dict]:
    anomalies = detect_cost_anomalies()
    if not anomalies:
        return ("No significant cost anomalies detected. Spend is within expected variance.", {})
    top = anomalies[0]
    answer = (
        f"**{len(anomalies)} cost anomalies detected:**\n\n"
        f"Most critical: *{top['message']}*\n\n"
        f"**Recommended actions:**\n"
        f"1. Review resource tags for the flagged service\n"
        f"2. Check for orphaned or untagged resources\n"
        f"3. Set up billing alarms at your monthly budget threshold\n"
        f"4. Enable Cost Anomaly Detection alerts in AWS Cost Explorer"
    )
    return answer, {"anomaly_count": len(anomalies)}


def _forecast(conn) -> tuple[str, dict]:
    h = _rows(conn, "SELECT * FROM cost_history ORDER BY month_index DESC LIMIT 2")
    if not h:
        return ("No historical data available.", {})
    latest = h[0]
    growth = ((h[0]["total_cost"] - h[1]["total_cost"]) / h[1]["total_cost"] * 100) if len(h) > 1 else 3.5
    next_m = latest["total_cost"] * (1 + growth / 100)
    answer = (
        f"**Spend Forecast:**\n\n"
        f"The ML model projects **{_fmt(next_m)}** next month (growth: {growth:+.1f}%/month).\n\n"
        f"**To reduce this:**\n"
        f"- Terminate idle EC2 instances (immediate impact)\n"
        f"- Increase Reserved Instance coverage to 60%+ (saves up to 30%)\n"
        f"- Apply S3 lifecycle policies (saves 70% on cold storage)\n"
        f"- Right-size Lambda memory allocations (linear cost reduction)"
    )
    return answer, {"next_month_estimate": round(next_m), "growth_pct": round(growth, 1)}


def _sustain(conn) -> tuple[str, dict]:
    from services.sustainability import compute_sustainability_score
    d = compute_sustainability_score()
    answer = (
        f"**Sustainability Score: {d['score']}/100 ({d['status']})**\n\n"
        f"Estimated CO₂ reduction potential: **{d['co2_reduction_estimate']}**\n\n"
        f"**Efficiency breakdown:**\n"
        f"- Resource efficiency: {d['efficiency_breakdown']['resource_efficiency']}%\n"
        f"- Storage efficiency: {d['efficiency_breakdown']['storage_efficiency']}%\n"
        f"- Regional carbon score: {d['efficiency_breakdown']['regional_carbon_score']:.0f}/100\n\n"
        f"**Top actions:** Terminate idle EC2, migrate high-carbon regions, archive cold S3 data."
    )
    return answer, d


def _default() -> tuple[str, dict]:
    return (
        "I'm **Sage**, your CloudSage AI FinOps advisor. Ask me about:\n\n"
        "- **Cost increases** — *'Why did costs increase?'*\n"
        "- **Savings** — *'How much can we save?'*\n"
        "- **EC2, S3, RDS, Lambda** optimization\n"
        "- **Forecasting** — *'What will we spend next month?'*\n"
        "- **Sustainability** — *'What is our carbon footprint?'*\n"
        "- **Anomalies** — *'Are there any cost spikes?'*",
        {},
    )


@router.post("/chat/sage", summary="Ask Sage AI Advisor", tags=["AI Assistant"], response_model=ChatResponse)
def sage_chat(request: ChatRequest):
    if not (request.question or "").strip():
        raise HTTPException(400, "Question cannot be empty.")
    q = request.question.lower().strip()
    conn = get_connection()
    try:
        if _has(q, "cost increase", "why did cost", "spend increase", "more expensive", "higher"):
            answer, ctx = _cost_increase(conn)
        elif _has(q, "saving", "save money", "reduce cost", "cut cost", "how much can"):
            answer, ctx = _savings(conn)
        elif _has(q, "ec2", "instance", "compute", "cpu", "idle instance"):
            answer, ctx = _ec2(conn)
        elif _has(q, "s3", "bucket", "storage", "glacier", "archive"):
            answer, ctx = _s3(conn)
        elif _has(q, "rds", "database", "db", "connection", "postgres", "mysql"):
            answer, ctx = _rds(conn)
        elif _has(q, "lambda", "function", "serverless", "memory"):
            answer, ctx = _lam(conn)
        elif _has(q, "anomaly", "anomalies", "spike", "unusual", "alert"):
            answer, ctx = _anomaly(conn)
        elif _has(q, "forecast", "predict", "next month", "future spend", "projection"):
            answer, ctx = _forecast(conn)
        elif _has(q, "carbon", "sustainability", "green", "co2", "emission"):
            answer, ctx = _sustain(conn)
        else:
            answer, ctx = _default()
    finally:
        conn.close()

    return ChatResponse(answer=answer, data_context=ctx if ctx else None)
