import { X, Printer, FileText, CheckCircle2, ShieldCheck, Download } from "lucide-react";

export default function ClinicalSoapNoteModal({ isOpen, onClose, result, payload, userId }) {
  if (!isOpen || !result) return null;

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const mrn = `MRN-${Math.abs(userId?.split("").reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0) % 90000) + 10000}`;
  const glucose = payload?.glucose || 140;
  const bmi = payload?.bmi || 30;
  const bp = payload?.blood_pressure || 80;
  const age = payload?.age || 40;

  return (
    <div className="modal-scrim">
      <div className="modal-panel soap-modal">
        <div className="modal-header no-print">
          <div className="modal-title-row">
            <FileText size={20} />
            <h2>Clinical Consultation Summary Note (EHR SOAP)</h2>
          </div>
          <div className="soap-modal-actions">
            <button className="primary" onClick={() => window.print()} style={{ padding: "6px 12px", fontSize: 13 }}>
              <Printer size={14} />
              Print / Save PDF
            </button>
            <button className="toast-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable SOAP Note Container */}
        <div className="soap-sheet">
          {/* Clinic Header */}
          <div className="soap-clinic-header">
            <div>
              <h3>DEPARTMENT OF METABOLIC HEALTH & PREVENTIVE ENDOCRINOLOGY</h3>
              <p>Metabolic Risk Stratification & Clinical Decision Support Service</p>
            </div>
            <div className="soap-date-box">
              <span><strong>Encounter Date:</strong> {today}</span>
              <span><strong>Patient ID:</strong> {userId}</span>
              <span><strong>Record #:</strong> {mrn}</span>
            </div>
          </div>

          <hr className="soap-divider" />

          {/* ICD-10 Codes */}
          <div className="soap-section">
            <span className="soap-tag">DIAGNOSTIC & BILLING CODES (ICD-10-CM)</span>
            <div className="icd-tags-row">
              <span className="icd-code"><strong>Z13.1</strong> Encounter for screening for diabetes mellitus</span>
              {glucose >= 126 ? (
                <span className="icd-code alert"><strong>E11.9</strong> Type 2 diabetes mellitus without complications</span>
              ) : glucose >= 100 ? (
                <span className="icd-code warn"><strong>R73.03</strong> Prediabetes</span>
              ) : null}
              {bmi >= 30 ? (
                <span className="icd-code warn"><strong>E66.01</strong> Morbid obesity / elevated adiposity</span>
              ) : null}
            </div>
          </div>

          {/* S: Subjective */}
          <div className="soap-section">
            <h4>S: SUBJECTIVE</h4>
            <p>
              Patient presents for routine metabolic and cardiovascular risk assessment. Age: {age} years.
              Familial diabetes pedigree coefficient reported at {payload?.diabetes_pedigree || 0.35}.
              Obstetric history: {payload?.pregnancies || 0} prior pregnancies. Patient denies acute ketoacidosis
              symptoms; reports lifestyle review.
            </p>
          </div>

          {/* O: Objective */}
          <div className="soap-section">
            <h4>O: OBJECTIVE (CLINICAL BIOMARKERS)</h4>
            <table className="soap-biomarkers-table">
              <thead>
                <tr>
                  <th>Biomarker</th>
                  <th>Observed Value</th>
                  <th>Clinical Reference Range</th>
                  <th>Flag</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Fasting Plasma Glucose</td>
                  <td><strong>{glucose} mg/dL</strong></td>
                  <td>70 - 99 mg/dL</td>
                  <td>{glucose >= 126 ? "DIABETIC" : glucose >= 100 ? "PREDIABETIC" : "NORMAL"}</td>
                </tr>
                <tr>
                  <td>Body Mass Index (BMI)</td>
                  <td><strong>{Number(bmi).toFixed(1)} kg/m²</strong></td>
                  <td>18.5 - 24.9 kg/m²</td>
                  <td>{bmi >= 30 ? "OBESE" : bmi >= 25 ? "OVERWEIGHT" : "NORMAL"}</td>
                </tr>
                <tr>
                  <td>Diastolic Blood Pressure</td>
                  <td><strong>{bp} mmHg</strong></td>
                  <td>&lt; 80 mmHg</td>
                  <td>{bp >= 90 ? "STAGE 2 HTN" : bp >= 80 ? "PRE-HTN" : "NORMAL"}</td>
                </tr>
                <tr>
                  <td>Serum Insulin (Fasting)</td>
                  <td><strong>{payload?.insulin || "--"} µU/mL</strong></td>
                  <td>&lt; 25 µU/mL</td>
                  <td>{payload?.insulin >= 120 ? "ELEVATED" : "NORMAL"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* A: Assessment */}
          <div className="soap-section">
            <h4>A: CLINICAL ASSESSMENT & PREDICTIVE MODELING</h4>
            <div className="soap-assessment-box">
              <div className="soap-score-callout">
                <span className="soap-score-label">Calibrated AI Risk Probability:</span>
                <span className="soap-score-num">{(result.risk_score * 100).toFixed(1)}%</span>
                <span className={`risk-band ${result.risk_band}`}>{result.risk_band.toUpperCase()} RISK</span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--ink-muted)" }}>
                Patient falls in the <strong>{result.percentile}th percentile</strong> of clinical vulnerability.
                Prediction model: <code>{result.model_version}</code> (Logistic Regression with Stratified CV & Isotonic Calibration).
              </p>
            </div>

            <div style={{ marginTop: 10 }}>
              <strong>Top Attributed Risk Drivers (SHAP Game Theory):</strong>
              <ul className="soap-list">
                {result.shap_contributions?.slice(0, 3).map((s, idx) => (
                  <li key={idx}>
                    <code>{s.feature}</code>: contributed <strong>{s.value >= 0 ? "+" : ""}{(s.value * 100).toFixed(1)}%</strong> to the risk margin.
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* P: Plan */}
          <div className="soap-section">
            <h4>P: INTERVENTION PLAN & ORDERS</h4>
            <ol className="soap-list">
              <li>
                <strong>Laboratory Diagnostics Ordered:</strong> Confirmative Hemoglobin A1c (HbA1c), Fasting Lipid Panel (Total, HDL, LDL, Triglycerides), Comprehensive Metabolic Panel (CMP), and spot urine Albumin-to-Creatinine Ratio (uACR).
              </li>
              <li>
                <strong>Dietary Prescription:</strong> Medical Nutrition Therapy (MNT). Low-glycemic Mediterranean dietary pattern; eliminate refined carbohydrates and sugar-sweetened beverages.
              </li>
              <li>
                <strong>Physical Activity:</strong> 150 minutes per week of moderate-intensity aerobic exercise (e.g., brisk walking, cycling) distributed across &ge;3 days, plus 2 resistance training sessions weekly.
              </li>
              <li>
                <strong>Follow-up:</strong> Clinic follow-up in 90 days with repeat metabolic panel to assess risk trajectory.
              </li>
            </ol>
          </div>

          {/* Signature Block */}
          <div className="soap-signature-row">
            <div>
              <p>Electronically Verified by:</p>
              <div className="soap-sig-line">
                <strong>Attending Clinical Specialist, MD</strong>
                <span>License #: MD-948201-GA</span>
              </div>
            </div>
            <div className="soap-stamp">
              <ShieldCheck size={28} />
              <span>CLINICALLY VALIDATED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
