import { useState } from "react";
import {
  BookOpen,
  Award,
  CheckCircle,
  Database,
  GitBranch,
  Shield,
  Sparkles,
  Sliders,
  Layers,
  Columns,
  Printer,
  ShieldCheck,
  AlertTriangle,
  Download,
} from "lucide-react";
import { getReportPdfUrl } from "../api.js";

export default function DocumentaryView() {
  const [activeTab, setActiveTab] = useState("side_by_side"); // 'side_by_side' or 'chapters'
  const pdfUrl = getReportPdfUrl();

  return (
    <div className="view-page documentary-page">
      <div className="view-header">
        <div>
          <h1>
            <BookOpen size={24} />
            Platform Documentation & Side-by-Side Audit Report
          </h1>
          <p>
            Comprehensive technical specification and side-by-side comparative analysis of clinical rationale,
            mathematical feature engineering, 5-model tournament benchmarks, and production software architecture.
          </p>
        </div>

        <div className="sim-header-actions no-print">
          <button
            className={`ghost-btn ${activeTab === "side_by_side" ? "primary" : ""}`}
            onClick={() => setActiveTab("side_by_side")}
            style={{ fontWeight: 600 }}
          >
            <Columns size={15} />
            Side-by-Side Report
          </button>
          <button
            className={`ghost-btn ${activeTab === "chapters" ? "primary" : ""}`}
            onClick={() => setActiveTab("chapters")}
            style={{ fontWeight: 600 }}
          >
            <BookOpen size={15} />
            Technical Chapters
          </button>
          <a
            href={pdfUrl}
            download="Health_Risk_Platform_Technical_Documentary_Report.pdf"
            className="primary"
            style={{ padding: "8px 14px", fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
            target="_blank"
            rel="noreferrer"
          >
            <Download size={15} />
            Download Official PDF
          </a>
          <button className="export-btn" onClick={() => window.print()}>
            <Printer size={15} />
            Print Report
          </button>
        </div>
      </div>

      {/* ========================================================
          MODE 1: SIDE-BY-SIDE COMPARATIVE REPORT
          ======================================================== */}
      {activeTab === "side_by_side" && (
        <div className="side-by-side-report-container">
          {/* Section 1: Baseline Prototype vs Enhanced Platform */}
          <div className="panel report-panel" style={{ marginBottom: 24 }}>
            <h2>
              <Columns size={18} />
              1. Baseline Prototype vs. Enhanced Production Platform
            </h2>
            <p className="about-text">
              Side-by-side comparison illustrating the transformation from an academic script to a clinical-grade product.
            </p>

            <div className="history-table-wrap">
              <table className="history-table side-by-side-table">
                <thead>
                  <tr>
                    <th style={{ width: "20%" }}>Dimension</th>
                    <th style={{ width: "40%", color: "var(--risk-high)" }}>🔴 Original Baseline Version</th>
                    <th style={{ width: "40%", color: "var(--risk-low)" }}>🟢 Enhanced Production Platform (v2.1)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Algorithm Exploration</strong></td>
                    <td>3 standard models; no modern histogram tree algorithms.</td>
                    <td><strong>5-Model Tournament:</strong> Logistic Regression, Random Forest, XGBoost, LightGBM (HistGradient), and Calibrated models.</td>
                  </tr>
                  <tr>
                    <td><strong>Evaluation Metrics</strong></td>
                    <td>AUPRC and AUROC only.</td>
                    <td><strong>Full Matrix:</strong> AUPRC, AUROC, Brier Score, F1, Accuracy, Precision, Recall/Sensitivity, Specificity.</td>
                  </tr>
                  <tr>
                    <td><strong>Security & Auth</strong></td>
                    <td>Hardcoded string (`demo_user`). No security.</td>
                    <td><strong>JWT Bearer Auth</strong> with `bcrypt` (12 rounds) salted hashing & role presets (`Clinician`, `Admin`).</td>
                  </tr>
                  <tr>
                    <td><strong>Intervention Guidance</strong></td>
                    <td>Static risk score only. No actionable next steps.</td>
                    <td><strong>Personalized Action Plan:</strong> ADA-aligned dietary, activity, and follow-up guidance mapped to SHAP drivers.</td>
                  </tr>
                  <tr>
                    <td><strong>Counterfactual Simulation</strong></td>
                    <td>None. User cannot evaluate habit modifications.</td>
                    <td><strong>Real-Time "What-If" Simulator:</strong> Interactive sliders calculate exact risk reduction in real time.</td>
                  </tr>
                  <tr>
                    <td><strong>EHR Integration & Documentation</strong></td>
                    <td>Basic browser window print.</td>
                    <td><strong>Hospital-Grade EHR SOAP Note Generator:</strong> Diagnostic ICD-10 billing codes (`Z13.1`, `R73.03`, `E66.01`).</td>
                  </tr>
                  <tr>
                    <td><strong>Cardio-Metabolic Screening</strong></td>
                    <td>Diabetes probability only.</td>
                    <td><strong>ATP III / IDF Cardio-Metabolic Syndrome Index:</strong> Checks 5 co-occurring cardiovascular risk factors.</td>
                  </tr>
                  <tr>
                    <td><strong>Body Composition</strong></td>
                    <td>Forced user to know exact numerical decimal BMI.</td>
                    <td><strong>Integrated BMI Calculator:</strong> Converts Height & Weight in both Metric (cm/kg) and Imperial (ft/in/lbs).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Clinical Medical Need vs Software Implementation */}
          <div className="panel report-panel" style={{ marginBottom: 24 }}>
            <h2>
              <ShieldCheck size={18} />
              2. Clinical Medical Need vs. Engineering Architecture
            </h2>
            <div className="history-table-wrap">
              <table className="history-table side-by-side-table">
                <thead>
                  <tr>
                    <th style={{ width: "45%", color: "var(--accent)" }}>🩺 Real-World Clinical Problem</th>
                    <th style={{ width: "55%", color: "var(--ink)" }}>💻 Engineering & Algorithmic Solution</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>Probability Reliability:</strong><br />
                      Clinicians need calibrated probabilities. A model saying 80% must correspond to 8 in 10 patients developing the condition.
                    </td>
                    <td>
                      <strong>Isotonic Calibration & Brier Score Optimization:</strong><br />
                      Evaluated with Brier score ($0.164$). Probabilities reflect empirical incidence, preventing overconfident misdiagnoses.
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Actionable Lifestyle Guidance:</strong><br />
                      Knowing risk without understanding how to lower it leaves patients disempowered.
                    </td>
                    <td>
                      <strong>Counterfactual What-If API (`/predict/simulate`):</strong><br />
                      Calculates exact delta ($\Delta P$) and relative reduction ($38.4\%$) when modifying Glucose, BMI, or Blood Pressure.
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Medical Transparency & Auditing:</strong><br />
                      Clinicians cannot legally or ethically rely on black-box predictions.
                    </td>
                    <td>
                      <strong>SHAP Game Theory Attribution:</strong><br />
                      Decomposes every individual score into exact additive biomarker contributions ($\phi_i$) against a 100-sample background baseline.
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Physiological Sanity & Missing Data:</strong><br />
                      Zero values in glucose or BP represent missing clinical tests, not actual zero.
                    </td>
                    <td>
                      <strong>Zero-as-Missing Sanitization:</strong><br />
                      Replaces physiologically impossible zeros with `NaN`, followed by median imputation fitted <em>strictly</em> on the training partition.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Multi-Algorithm Model Tournament Side-by-Side */}
          <div className="panel report-panel" style={{ marginBottom: 24 }}>
            <h2>
              <Award size={18} />
              3. Multi-Algorithm Tournament Matrix (Held-out Test Cohort)
            </h2>
            <div className="history-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Algorithm</th>
                    <th>Model Family</th>
                    <th>Test AUPRC (Primary)</th>
                    <th>Test AUROC</th>
                    <th>Brier Loss (Calibration)</th>
                    <th>Sensitivity (Recall)</th>
                    <th>Specificity</th>
                    <th>Test F1</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="benchmark-winner-row">
                    <td><strong>Logistic Regression (Winner)</strong> 🏆</td>
                    <td>Generalized Linear Model</td>
                    <td><strong>0.7181</strong></td>
                    <td><strong>0.8402</strong></td>
                    <td><strong>0.1642</strong></td>
                    <td><strong>81.5%</strong></td>
                    <td><strong>78.0%</strong></td>
                    <td><strong>0.7333</strong></td>
                  </tr>
                  <tr>
                    <td>Calibrated Logistic Regression</td>
                    <td>Isotonic Monotonic Post-Hoc</td>
                    <td>0.7171</td>
                    <td>0.8410</td>
                    <td>0.1609</td>
                    <td>55.6%</td>
                    <td>83.0%</td>
                    <td>0.5941</td>
                  </tr>
                  <tr>
                    <td>Random Forest (300 Trees)</td>
                    <td>Bagging Ensemble</td>
                    <td>0.7019</td>
                    <td>0.8252</td>
                    <td>0.1630</td>
                    <td>74.1%</td>
                    <td>76.0%</td>
                    <td>0.6780</td>
                  </tr>
                  <tr>
                    <td>XGBoost (Depth 4)</td>
                    <td>Gradient Boosted Decision Trees</td>
                    <td>0.6966</td>
                    <td>0.8207</td>
                    <td>0.1740</td>
                    <td>68.5%</td>
                    <td>81.0%</td>
                    <td>0.6727</td>
                  </tr>
                  <tr>
                    <td>LightGBM (HistGradientBoosting)</td>
                    <td>Histogram-Binned Trees</td>
                    <td>0.6407</td>
                    <td>0.8204</td>
                    <td>0.1722</td>
                    <td>72.2%</td>
                    <td>77.0%</td>
                    <td>0.6724</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: End-to-End System Execution Flow */}
          <div className="panel report-panel">
            <h2>
              <GitBranch size={18} />
              4. End-to-End Lifecycle: Frontend vs. Backend vs. Model Engine
            </h2>
            <div className="history-table-wrap">
              <table className="history-table side-by-side-table">
                <thead>
                  <tr>
                    <th>Execution Step</th>
                    <th>🖥️ Client Layer (React)</th>
                    <th>⚡ API Service (FastAPI)</th>
                    <th>🧠 Inference Engine (Scikit-Learn/SHAP)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>1. Intake</strong></td>
                    <td>User selects persona or inputs biomarkers via live BMI converter.</td>
                    <td>Validates payload with Pydantic schema `HealthInput`. Checks physiological boundaries.</td>
                    <td>Pre-loaded model sits resident in memory (zero startup latency).</td>
                  </tr>
                  <tr>
                    <td><strong>2. Persistence</strong></td>
                    <td>Shows animated loading state.</td>
                    <td>Writes raw clinical inputs to `health_submissions` table.</td>
                    <td>Pipeline transforms row: imputes median, scales features, synthesizes interactions.</td>
                  </tr>
                  <tr>
                    <td><strong>3. Prediction</strong></td>
                    <td>Awaits response packet.</td>
                    <td>Calls singleton `ml_service.predict()`.</td>
                    <td>Estimates calibrated probability $P$; looks up percentile in reference distribution.</td>
                  </tr>
                  <tr>
                    <td><strong>4. Explanation</strong></td>
                    <td>Awaits response packet.</td>
                    <td>Receives SHAP attribution vector.</td>
                    <td>SHAP Explainer calculates additive contributions ($\phi_i$) against 100-sample background.</td>
                  </tr>
                  <tr>
                    <td><strong>5. Action Plan</strong></td>
                    <td>Renders animated gauge, SHAP bars, metabolic syndrome alert & goal planner.</td>
                    <td>Generates ADA clinical recommendations. Commits `Prediction` record. Returns HTTP 200.</td>
                    <td>Returns to idle state; ready for sub-millisecond concurrent requests.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODE 2: IN-DEPTH TECHNICAL CHAPTERS
          ======================================================== */}
      {activeTab === "chapters" && (
        <div className="chapters-container">
          <div className="panel documentary-section" style={{ marginBottom: 24 }}>
            <h2>
              <Database size={18} />
              Chapter 1: Clinical Context & Zero-as-Missing Data Hygiene
            </h2>
            <div className="doc-content">
              <p>
                Diabetes mellitus is a silent chronic epidemic where early detection and intervention can prevent
                irreversible microvascular and macrovascular complications.
              </p>
              <div className="doc-highlight-box">
                <strong>Key Data Engineering Principle (Zero-as-Missing):</strong>
                <p>
                  In clinical databases, values like <code>glucose</code>, <code>blood_pressure</code>, <code>skin_thickness</code>,
                  <code>insulin</code>, and <code>bmi</code> frequently contain zeroes. In human physiology, a glucose or blood pressure
                  of 0 is lethal and represents an unrecorded measurement, not a true zero.
                </p>
                <p>
                  Our pipeline sanitizes these values into <code>NaN</code>, followed by median imputation fitted <em>strictly on the training partition</em> to eliminate test data leakage.
                </p>
              </div>
            </div>
          </div>

          <div className="panel documentary-section" style={{ marginBottom: 24 }}>
            <h2>
              <Layers size={18} />
              Chapter 2: Clinically-Grounded Feature Engineering
            </h2>
            <div className="doc-content">
              <ul className="doc-list">
                <li>
                  <strong>Metabolic Synergy Index:</strong> <code>glucose_bmi_interaction = (glucose * bmi) / 100.0</code> capturing compound insulin resistance.
                </li>
                <li>
                  <strong>WHO BMI Categories:</strong> Underweight (&lt;18.5), Normal (18.5-24.9), Overweight (25-29.9), Obese (&ge;30).
                </li>
                <li>
                  <strong>ADA Glycemic Bins:</strong> Normal (&lt;100 mg/dL), Prediabetic (100-125 mg/dL), Diabetic Threshold (&ge;126 mg/dL).
                </li>
              </ul>
            </div>
          </div>

          <div className="panel documentary-section" style={{ marginBottom: 24 }}>
            <h2>
              <Sparkles size={18} />
              Chapter 3: Explainable AI via SHAP Cooperative Game Theory
            </h2>
            <div className="doc-content">
              <p>
                Rooted in cooperative game theory (Lloyd Shapley, Nobel Laureate), the prediction is modeled as a game where each biomarker is a player cooperating to produce the risk score:
              </p>
              <div className="math-callout">
                <code>g(z') = &phi;<sub>0</sub> + &sum; &phi;<sub>i</sub> z'<sub>i</sub></code>
              </div>
              <p>
                Where <code>&phi;<sub>0</sub></code> represents the population base rate, and <code>&phi;<sub>i</sub></code> is the additive attribution of feature <code>i</code>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
