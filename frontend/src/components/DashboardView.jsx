import { useState } from "react";
import {
  ClipboardList,
  Gauge,
  Sparkles,
  TrendingUp,
  Printer,
  Sliders,
  ShieldCheck,
  FileText,
  User,
  HeartPulse,
} from "lucide-react";
import RiskForm from "./RiskForm.jsx";
import RiskScoreCard from "./RiskScoreCard.jsx";
import ShapExplanation from "./ShapExplanation.jsx";
import TrendChart from "./TrendChart.jsx";
import RecommendationCard from "./RecommendationCard.jsx";
import MetabolicSyndromeCard from "./MetabolicSyndromeCard.jsx";
import LifestyleGoalPlanner from "./LifestyleGoalPlanner.jsx";
import ClinicalSoapNoteModal from "./ClinicalSoapNoteModal.jsx";

export default function DashboardView({
  result,
  history,
  loading,
  onSubmit,
  onError,
  userId,
  onNavigateToSim,
  latestPayload,
}) {
  const [isSoapModalOpen, setIsSoapModalOpen] = useState(false);

  return (
    <div className="view-page">
      {/* Real Clinical Header with Patient Banner */}
      <div className="view-header">
        <div>
          <div className="clinical-badge-row">
            <span className="live-clinic-badge">
              <span className="live-dot" />
              EHR Clinical Decision Support
            </span>
            <span className="patient-id-badge">
              <User size={12} />
              Active Patient: <strong>{userId}</strong>
            </span>
          </div>

          <h1 style={{ marginTop: 6 }}>Clinical Risk Intelligence Dashboard</h1>
          <p>
            Assess patient metabolic biomarkers to estimate calibrated diabetes risk, inspect local
            SHAP attribution drivers, review evidence-based clinical recommendations, and simulate
            lifestyle interventions.
          </p>
        </div>

        <div className="view-header-actions no-print">
          {result && (
            <button
              className="ghost-btn"
              onClick={() => setIsSoapModalOpen(true)}
              style={{ fontWeight: 600 }}
            >
              <FileText size={15} />
              Generate EHR SOAP Note
            </button>
          )}

          {result && onNavigateToSim && (
            <button
              className="primary"
              onClick={onNavigateToSim}
              style={{ padding: "8px 14px", fontSize: 13 }}
            >
              <Sliders size={14} />
              Simulate "What-If"
            </button>
          )}

          {result && (
            <button className="export-btn" onClick={() => window.print()}>
              <Printer size={15} />
              Print Summary
            </button>
          )}
        </div>
      </div>

      {/* Clinical Consultation & Telemetry Hero Card */}
      <div className="clinical-hero-card no-print">
        <div className="clinical-hero-content">
          <div className="live-clinic-badge" style={{ width: "fit-content", marginBottom: 10 }}>
            <span className="live-dot" />
            Active Clinical Session
          </div>
          <h2 style={{ fontSize: 20, margin: "0 0 8px 0", color: "var(--text)" }}>
            Precision Metabolic Risk Stratification
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.55 }}>
            Evaluating real-time clinical biomarkers against cross-validated machine learning models. 
            Review local Shapley attributions, assess metabolic syndrome criteria, and generate EHR-compliant documentation.
          </p>

          <div className="hero-stats-row">
            <span className="hero-stat-pill">
              Model: <strong>LogReg (Calibrated)</strong>
            </span>
            <span className="hero-stat-pill">
              Test AUROC: <strong>0.8513</strong>
            </span>
            <span className="hero-stat-pill">
              Test AUPRC: <strong>0.7734</strong>
            </span>
            <span className="hero-stat-pill">
              Cohort: <strong>7,768 Patients (Multi-Center)</strong>
            </span>
            <span className="hero-stat-pill">
              Guideline: <strong>ADA 2026 Standards</strong>
            </span>
          </div>
        </div>

        <div className="clinical-hero-media">
          <img
            src="/images/clinical_hero.jpg"
            alt="Doctor consulting patient with clinical telemetry"
            loading="lazy"
          />
          <div className="clinical-hero-media-overlay" />
        </div>
      </div>

      {/* Main Intake & Gauge Grid */}
      <div className="grid two-col">
        <div className="panel">
          <h2>
            <ClipboardList size={17} />
            Patient Assessment Intake
          </h2>
          <RiskForm userId={userId} onResult={onSubmit} onError={onError} initialValues={latestPayload} />
        </div>

        <div className="panel">
          <h2>
            <Gauge size={17} />
            Calibrated Risk Probability
          </h2>
          <RiskScoreCard result={result} loading={loading} />
        </div>
      </div>

      {/* SHAP Breakdown and Clinical Action Plan */}
      <div className="grid two-col" style={{ marginTop: 28 }}>
        <div className="panel">
          <h2>
            <Sparkles size={17} />
            Biomarker Attributions (SHAP Game Theory)
          </h2>
          <ShapExplanation result={result} loading={loading} />
        </div>

        <div className="panel">
          <h2>
            <ShieldCheck size={17} />
            Personalized Clinical Action Plan (ADA Guidelines)
          </h2>
          <RecommendationCard
            recommendations={result?.recommendations}
            riskBand={result?.risk_band}
          />
        </div>
      </div>

      {/* Cardio-Metabolic Risk Index (ATP III Criteria) */}
      {latestPayload && (
        <MetabolicSyndromeCard payload={latestPayload} />
      )}

      {/* 90-Day Lifestyle Goal Planner */}
      {result && (
        <LifestyleGoalPlanner
          baselineResult={result}
          onLaunchSimulatorWithGoals={() => onNavigateToSim?.()}
        />
      )}

      {/* Longitudinal Risk Over Time */}
      <div className="panel" style={{ marginTop: 28 }}>
        <h2>
          <TrendingUp size={17} />
          Longitudinal Risk Trajectory
        </h2>
        <TrendChart history={history} />
      </div>

      {/* SOAP Clinical Note Modal */}
      <ClinicalSoapNoteModal
        isOpen={isSoapModalOpen}
        onClose={() => setIsSoapModalOpen(false)}
        result={result}
        payload={latestPayload}
        userId={userId}
      />
    </div>
  );
}
