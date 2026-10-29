from typing import Any, Dict, Optional


def calculate_clinical_biomarkers(payload: dict) -> Dict[str, Any]:
    """
    Computes key endocrine and cardiovascular biomarkers:
    - HOMA-IR (Homeostatic Model Assessment of Insulin Resistance)
    - Mean Arterial Pressure (MAP)
    - 10-Year Atherosclerotic Cardiovascular Disease (ASCVD) Risk Proxy
    """
    glucose = float(payload.get("glucose") or 0)
    insulin = float(payload.get("insulin") or 0)
    bp = float(payload.get("blood_pressure") or 0)
    bmi = float(payload.get("bmi") or 0)
    age = float(payload.get("age") or 0)

    # 1. HOMA-IR: (Fasting Glucose [mg/dL] * Fasting Insulin [µU/mL]) / 405
    homa_ir = None
    homa_ir_status = "Not Assayed (Insulin 0)"
    if glucose > 0 and insulin > 0:
        homa_val = round((glucose * insulin) / 405.0, 2)
        homa_ir = homa_val
        if homa_val < 1.9:
            homa_ir_status = "Optimal Sensitivity (< 1.9)"
        elif homa_val <= 2.9:
            homa_ir_status = "Early Insulin Resistance (1.9 - 2.9)"
        else:
            homa_ir_status = "Significant Insulin Resistance (> 2.9)"

    # 2. Mean Arterial Pressure (MAP) approximation: Diastolic + (1/3) * Pulse Pressure (~40 mmHg)
    map_val = round(bp + 13.3, 1) if bp > 0 else None

    # 3. 10-Year ASCVD Cardiovascular Risk Estimate
    base_ascvd = 0.015
    if age > 40:
        base_ascvd += (age - 40) * 0.006
    if bp >= 85:
        base_ascvd += 0.045
    if bmi >= 30:
        base_ascvd += 0.035
    if glucose >= 126:
        base_ascvd += 0.070
    elif glucose >= 100:
        base_ascvd += 0.030

    ascvd_risk = round(min(0.65, max(0.01, base_ascvd)), 3)
    if ascvd_risk < 0.05:
        ascvd_band = "Low Risk (<5%)"
    elif ascvd_risk < 0.075:
        ascvd_band = "Borderline (5-7.5%)"
    elif ascvd_risk < 0.20:
        ascvd_band = "Intermediate (7.5-20%)"
    else:
        ascvd_band = "High Risk (>20%)"

    return {
        "homa_ir": homa_ir,
        "homa_ir_status": homa_ir_status,
        "map_pressure": map_val,
        "ascvd_10yr_risk": ascvd_risk,
        "ascvd_band": ascvd_band,
    }
