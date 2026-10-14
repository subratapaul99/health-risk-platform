import { HeartPulse, AlertTriangle, CheckCircle2, Info } from "lucide-react";

export default function MetabolicSyndromeCard({ payload }) {
  if (!payload) return null;

  const glucose = Number(payload.glucose) || 0;
  const bmi = Number(payload.bmi) || 0;
  const bp = Number(payload.blood_pressure) || 0;
  const insulin = Number(payload.insulin) || 0;
  const age = Number(payload.age) || 0;

  const criteria = [
    {
      name: "Impaired Fasting Glycemia",
      present: glucose >= 100,
      detail: `${glucose} mg/dL (Threshold: ≥100)`,
      severity: glucose >= 126 ? "high" : glucose >= 100 ? "moderate" : "normal",
    },
    {
      name: "Elevated Diastolic BP",
      present: bp >= 85,
      detail: `${bp} mmHg (Threshold: ≥85)`,
      severity: bp >= 90 ? "high" : bp >= 85 ? "moderate" : "normal",
    },
    {
      name: "Clinical Adiposity (BMI)",
      present: bmi >= 30,
      detail: `${bmi.toFixed(1)} kg/m² (Threshold: ≥30.0)`,
      severity: bmi >= 30 ? "high" : bmi >= 25 ? "moderate" : "normal",
    },
    {
      name: "Hyperinsulinemia Marker",
      present: insulin >= 120,
      detail: `${insulin} µU/mL (Threshold: ≥120)`,
      severity: insulin >= 140 ? "high" : insulin >= 120 ? "moderate" : "normal",
    },
    {
      name: "Vascular Age Risk Factor",
      present: age >= 45,
      detail: `${age} years (Threshold: ≥45)`,
      severity: age >= 55 ? "high" : age >= 45 ? "moderate" : "normal",
    },
  ];

  const positiveCount = criteria.filter((c) => c.present).length;
  const hasMetabolicSyndrome = positiveCount >= 3;

  return (
    <div className="metabolic-card panel" style={{ marginTop: 24 }}>
      <div className="metabolic-header">
        <div className="metabolic-title">
          <HeartPulse size={18} className="metabolic-icon" />
          <h3>Cardio-Metabolic Risk Index (ATP III / IDF Criteria)</h3>
        </div>
        <div
          className={`metabolic-status-tag ${
            hasMetabolicSyndrome ? "flagged" : positiveCount >= 2 ? "warning" : "cleared"
          }`}
        >
          {hasMetabolicSyndrome ? (
            <>
              <AlertTriangle size={13} />
              Metabolic Syndrome Indicated ({positiveCount}/5 Criteria)
            </>
          ) : positiveCount >= 2 ? (
            <>
              <AlertTriangle size={13} />
              Borderline Risk ({positiveCount}/5 Criteria)
            </>
          ) : (
            <>
              <CheckCircle2 size={13} />
              Low Metabolic Risk ({positiveCount}/5 Criteria)
            </>
          )}
        </div>
      </div>

      <p className="metabolic-subtext">
        Metabolic Syndrome is a cluster of co-occurring conditions that multiply the likelihood of Type 2
        diabetes, coronary artery disease, and stroke.
      </p>

      <div className="metabolic-criteria-grid">
        {criteria.map((item, idx) => (
          <div
            key={idx}
            className={`criteria-item ${item.present ? "item-flagged" : "item-clear"}`}
          >
            <div className="criteria-status-icon">
              {item.present ? (
                <span className="dot-flagged" />
              ) : (
                <span className="dot-cleared" />
              )}
            </div>
            <div className="criteria-text">
              <span className="criteria-name">{item.name}</span>
              <span className="criteria-detail">{item.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
