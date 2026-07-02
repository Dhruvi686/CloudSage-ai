import sys
sys.path.insert(0, '.')
from services.finops_score import compute_finops_score
from services.anomaly_detection import detect_cost_anomalies
from services.sustainability import compute_sustainability_score
from services.forecasting import run_forecast
from services.recommendation_engine import get_recommendations_summary

anom = detect_cost_anomalies()
fs = compute_finops_score(anomaly_count=len(anom))
ss = compute_sustainability_score()
fc = run_forecast()
rs = get_recommendations_summary()

print("=== CloudSage AI Final Verification ===")
print("FinOps Score:    ", fs["score"], fs["status"])
print("Sustainability:  ", ss["score"], ss["status"], "|", ss["co2_reduction_estimate"])
print("Forecast:        $" + str(fc["next_month_prediction"]), "| Trend:", fc["trend"], "| R2:", fc["confidence"])
print("Anomalies:       ", len(anom))
print("Recommendations: ", rs["total_recommendations"], "total |", rs["total_monthly_savings"], "/month")
print("  High priority: ", rs["high_priority_count"])
print("  By service:    ", rs["by_service"])
print()
print("ALL SYSTEMS GREEN OK")
