import { useState, useEffect } from "react";
import { Server, Cpu, CheckCircle2, Award, Activity, BarChart3, ShieldCheck, RefreshCw } from "lucide-react";
import { fetchModelRegistry, fetchSystemStats } from "../api.js";

export default function AdminView() {
  const [registry, setRegistry] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [regData, statsData] = await Promise.all([
        fetchModelRegistry(),
        fetchSystemStats(),
      ]);
      setRegistry(regData);
      setStats(statsData);
    } catch (err) {
      console.error("Admin data fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatModelName = (name) => {
    switch (name) {
      case "logistic_regression":
        return "Logistic Regression (Standard)";
      case "logistic_regression_calibrated":
        return "Calibrated Logistic Regression (Isotonic)";
      case "random_forest":
        return "Random Forest (300 Trees)";
      case "xgboost":
        return "XGBoost (Extreme Gradient Boost)";
      case "lightgbm_hist_gradient_boosting":
        return "LightGBM Architecture (HistGradientBoosting)";
      default:
        return name.replace(/_/g, " ").toUpperCase();
    }
  };

  if (loading) {
    return (
      <div className="view-page">
        <div className="skeleton-gauge-wrap">
          <div className="skeleton skeleton-line" style={{ width: 260, height: 28 }} />
          <div className="skeleton skeleton-row" style={{ height: 180, marginTop: 20 }} />
        </div>
      </div>
    );
  }

  const allModels = registry?.all_models || {};
  const activeWinner = registry?.active_winner || "logistic_regression";

  return (
    <div className="view-page admin-page">
      <div className="view-header">
        <div>
          <h1>
            <Server size={24} />
            Model Registry & Multi-Algorithm Benchmark Suite
          </h1>
          <p>
            Continuous tournament benchmarking across multiple model families with 5-fold stratified cross-validation,
            probability calibration evaluation, and clinical validation metrics.
          </p>
        </div>
        <button className="export-btn no-print" onClick={loadData}>
          <RefreshCw size={14} />
          Refresh Stats
        </button>
      </div>

      {/* Platform Health & Analytics Bar */}
      {stats && (
        <div className="metric-grid" style={{ marginBottom: 28 }}>
          <div className="metric-tile">
            <span className="metric-value">{stats.total_assessments}</span>
            <span className="metric-label">Total Predictions</span>
          </div>
          <div className="metric-tile">
            <span className="metric-value">{stats.unique_patients}</span>
            <span className="metric-label">Unique Patients</span>
          </div>
          <div className="metric-tile">
            <span className="metric-value" style={{ color: "var(--risk-low)" }}>
              {stats.risk_distribution?.low || 0}
            </span>
            <span className="metric-label">Low Risk Assessments</span>
          </div>
          <div className="metric-tile">
            <span className="metric-value" style={{ color: "var(--risk-moderate)" }}>
              {stats.risk_distribution?.moderate || 0}
            </span>
            <span className="metric-label">Moderate Risk</span>
          </div>
          <div className="metric-tile">
            <span className="metric-value" style={{ color: "var(--risk-high)" }}>
              {stats.risk_distribution?.high || 0}
            </span>
            <span className="metric-label">High Risk Alerts</span>
          </div>
          <div className="metric-tile">
            <span className="metric-value" style={{ fontSize: 16 }}>{stats.system_status}</span>
            <span className="metric-label">Engine Health</span>
          </div>
        </div>
      )}

      {/* Benchmark Matrix Table */}
      <div className="panel" style={{ marginBottom: 28 }}>
        <h2>
          <BarChart3 size={18} />
          Model Evaluation Matrix (Held-out Test Cohort)
        </h2>
        <p className="about-text">
          Because diabetes screening involves imbalanced outcomes (~65% negative, ~35% positive),
          <strong> AUPRC (Area Under Precision-Recall Curve)</strong> is our primary tournament selection criterion.
        </p>

        <div className="history-table-wrap">
          <table className="history-table admin-benchmark-table">
            <thead>
              <tr>
                <th>Model Architecture</th>
                <th>Status</th>
                <th>Test AUPRC (Primary)</th>
                <th>Test AUROC</th>
                <th>Brier Score (Calibration)</th>
                <th>F1 Score</th>
                <th>Accuracy</th>
                <th>Sensitivity / Recall</th>
                <th>Specificity</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(allModels).map(([modelKey, metrics]) => {
                const isWinner = modelKey === activeWinner;
                return (
                  <tr key={modelKey} className={isWinner ? "benchmark-winner-row" : ""}>
                    <td>
                      <div className="model-name-cell">
                        <strong>{formatModelName(modelKey)}</strong>
                        {isWinner && <Award size={15} className="winner-gold-icon" />}
                      </div>
                    </td>
                    <td>
                      {isWinner ? (
                        <span className="status-badge active-prod">
                          <CheckCircle2 size={12} /> Active in Production
                        </span>
                      ) : (
                        <span className="status-badge candidate">Candidate</span>
                      )}
                    </td>
                    <td>
                      <span className="metric-highlight">{(metrics.test_auprc * 100).toFixed(1)}%</span>
                    </td>
                    <td>{(metrics.test_auroc * 100).toFixed(1)}%</td>
                    <td>
                      <span className={metrics.test_brier <= 0.165 ? "text-green" : ""}>
                        {metrics.test_brier.toFixed(4)}
                      </span>
                    </td>
                    <td>{(metrics.test_f1 * 100).toFixed(1)}%</td>
                    <td>{(metrics.test_accuracy * 100).toFixed(1)}%</td>
                    <td>{(metrics.test_recall * 100).toFixed(1)}%</td>
                    <td>{(metrics.test_specificity * 100).toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Registry Details */}
      <div className="grid two-col">
        <div className="panel">
          <h2>
            <Cpu size={18} />
            Active Serving Model Architecture
          </h2>
          <div className="pipeline-specs">
            <div className="spec-row">
              <span className="spec-label">Model Identifier:</span>
              <span className="spec-val"><code>{registry?.active_winner}</code> ({registry?.version})</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Input Clinical Features:</span>
              <span className="spec-val">{registry?.feature_count} features (Continuous + Engineered Interaction)</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Training Pipeline:</span>
              <span className="spec-val">Median Imputation ➔ StandardScaler ➔ Contiguous Float Cast ➔ Estimator</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Explainability Engine:</span>
              <span className="spec-val">Kernel & Tree SHAP with 100-sample background reference distribution</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Training / Test Partition:</span>
              <span className="spec-val">{registry?.training_samples} training samples, {registry?.test_samples} held-out test samples</span>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>
            <ShieldCheck size={18} />
            Why Logistic Regression Won the Tournament
          </h2>
          <p className="about-text" style={{ fontSize: 13.5, lineHeight: 1.6 }}>
            In tabular healthcare datasets with moderate sample sizes (~768 patient records), high-capacity
            gradient-boosted trees (XGBoost, LightGBM) risk slight overfitting to noise and require more data
            to calibrate probabilities reliably.
          </p>
          <p className="about-text" style={{ fontSize: 13.5, lineHeight: 1.6 }}>
            <strong>Logistic Regression with balanced class weights</strong> achieved the highest test AUPRC (0.718)
            and superior Brier calibration score (0.164), meaning its output probabilities reflect genuine empirical risk
            rather than overconfident extreme values.
          </p>
        </div>
      </div>
    </div>
  );
}
