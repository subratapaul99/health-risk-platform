import { Info, ShieldAlert } from "lucide-react";

const METRICS = [
  { label: "Test AUROC", value: "0.851" },
  { label: "Test AUPRC", value: "0.773" },
  { label: "Cohort Size", value: "7,768 Patients" },
  { label: "Cross-val AUPRC", value: "0.753 ± 0.016" },
];

export default function AboutView() {
  return (
    <div className="view-page">
      <div className="view-header">
        <h1>
          <Info size={24} />
          Model Architecture & Validation
        </h1>
        <p>Diagnostic laboratory standards, machine learning tournament benchmarks, and explainability mechanisms.</p>
      </div>

      {/* AI Diagnostic Laboratory Banner */}
      <div className="lab-banner-container">
        <img
          src="/images/ai_lab.jpg"
          alt="Clinical AI diagnostic workstation showing real-time metabolic telemetry"
          loading="lazy"
        />
        <div className="lab-banner-caption">
          <div>
            <strong style={{ fontSize: 16 }}>Clinical AI Diagnostic Research Architecture</strong>
            <p style={{ margin: "3px 0 0", fontSize: 12.5, opacity: 0.9 }}>
              Benchmarked across 5 distinct classification architectures with Game-Theoretic SHAP attribution
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span className="hero-stat-pill" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
              Stratified 5-Fold CV
            </span>
            <span className="hero-stat-pill" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
              Platt Calibration
            </span>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 24 }}>
        <h2>Multi-Center Production Model</h2>
        <p className="about-text">
          <strong>Calibrated Logistic Regression & Ensemble Benchmark</strong>, trained on a comprehensive
          multi-center cohort of <strong>7,768 clinical patient records</strong> spanning three harmonized populations:
          the historical Pima Native American cohort (N=768), the Frankfurt Hospital inpatient/outpatient validation
          cohort (N=2,000), and the NHANES epidemiological community screening cohort (N=5,000).
          Missing measurements undergo median imputation inside leakage-free cross-validation folds, accompanied by
          ADA-aligned feature engineering (BMI category, glucose category, age bucket, and metabolic interaction proxies).
        </p>
        <div className="metric-grid">
          {METRICS.map((m) => (
            <div className="metric-tile" key={m.label}>
              <span className="metric-value">{m.value}</span>
              <span className="metric-label">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2>
          <ShieldAlert size={17} />
          Clinical Scope & Validation Boundaries
        </h2>
        <ul className="limitations-list">
          <li>Multi-center dataset expansion (7,768 records) significantly reduced fold variance from ±0.066 down to ±0.016, providing robust statistical convergence.</li>
          <li>Every individual prediction is explained via local SHAP attribution; attributions illustrate feature influence within the model, not direct clinical causality.</li>
          <li>Designed as a clinical decision support system (CDSS) for risk stratification and triage; not an autonomous diagnostic device.</li>
        </ul>
      </div>
    </div>
  );
}
