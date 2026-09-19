import { Info, ShieldAlert } from "lucide-react";

const METRICS = [
  { label: "Test AUROC", value: "0.840" },
  { label: "Test AUPRC", value: "0.718" },
  { label: "Test F1", value: "0.733" },
  { label: "Cross-val AUPRC", value: "0.743 ± 0.066" },
];

export default function AboutView() {
  return (
    <div className="view-page">
      <div className="view-header">
        <h1>
          <Info size={24} />
          Model info
        </h1>
        <p>What's actually running behind the risk score you see on the dashboard.</p>
      </div>

      <div className="panel" style={{ marginBottom: 24 }}>
        <h2>Current model</h2>
        <p className="about-text">
          <strong>Logistic regression</strong>, selected over random forest and
          XGBoost by test-set AUPRC after 5-fold stratified cross-validation.
          Trained on the Pima Indians Diabetes dataset (768 records, 8 clinical
          features), with median imputation for missing measurements and three
          engineered features (BMI category, glucose category, age bucket).
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
          Limitations
        </h2>
        <ul className="limitations-list">
          <li>Trained on a small (768-row), narrow population — not validated for general clinical use.</li>
          <li>Every prediction is explained with SHAP, but SHAP values reflect what the model learned, not medical causation.</li>
          <li>This is a portfolio / academic demonstration, not a diagnostic tool.</li>
        </ul>
      </div>
    </div>
  );
}
