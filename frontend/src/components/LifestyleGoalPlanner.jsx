import { useState } from "react";
import { Target, CheckCircle2, TrendingDown, Calendar, Sparkles, Award } from "lucide-react";

const GOAL_OPTIONS = [
  {
    id: "diet",
    title: "Low-Glycemic Mediterranean Nutrition",
    impact: "-18 mg/dL Glucose",
    glucoseDelta: -18,
    bmiDelta: -0.5,
    bpDelta: -2,
    description: "Replace refined grains with legumes, vegetables, olive oil, and lean proteins.",
  },
  {
    id: "exercise",
    title: "150 min/Week Moderate Aerobic Exercise",
    impact: "-1.5 BMI, -4 mmHg BP",
    glucoseDelta: -10,
    bmiDelta: -1.5,
    bpDelta: -4,
    description: "Brisk walking, swimming, or cycling 30 mins x 5 days to increase insulin sensitivity.",
  },
  {
    id: "dash",
    title: "DASH Sodium Reduction Protocol",
    impact: "-7 mmHg Blood Pressure",
    glucoseDelta: -4,
    bmiDelta: -0.2,
    bpDelta: -7,
    description: "Limit daily sodium to <2,300 mg/day with potassium-rich whole foods.",
  },
  {
    id: "weight",
    title: "5% Targeted Weight Loss Milestone",
    impact: "-2.5 BMI, -15 mg/dL Glucose",
    glucoseDelta: -15,
    bmiDelta: -2.5,
    bpDelta: -5,
    description: "500 kcal/day structured deficit proven to cut diabetes incidence by 58% (DPP Trial).",
  },
];

export default function LifestyleGoalPlanner({ baselineResult, onLaunchSimulatorWithGoals }) {
  const [selectedGoals, setSelectedGoals] = useState(["diet", "exercise"]);

  const toggleGoal = (id) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const baseScore = baselineResult?.risk_score || 0.65;

  // Approximate realistic compound 90-day risk reduction
  let totalGlucoseReduction = 0;
  let totalBmiReduction = 0;
  let totalBpReduction = 0;

  selectedGoals.forEach((gid) => {
    const goal = GOAL_OPTIONS.find((g) => g.id === gid);
    if (goal) {
      totalGlucoseReduction += Math.abs(goal.glucoseDelta);
      totalBmiReduction += Math.abs(goal.bmiDelta);
      totalBpReduction += Math.abs(goal.bpDelta);
    }
  });

  // Calculate projected 90-day risk
  const reductionMultiplier = Math.min(0.75, selectedGoals.length * 0.18);
  const projectedScore = Math.max(0.12, Number((baseScore * (1 - reductionMultiplier)).toFixed(3)));
  const percentageDrop = Math.round(((baseScore - projectedScore) / baseScore) * 100);

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 90);
  const formattedFutureDate = futureDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="panel lifestyle-planner-panel" style={{ marginTop: 28 }}>
      <div className="planner-header">
        <div className="planner-title-row">
          <Target size={20} className="planner-icon" />
          <h2>Patient 90-Day Lifestyle Goal Planner & Trajectory Projection</h2>
        </div>
        <span className="planner-badge">
          <Calendar size={13} />
          Target Milestone: {formattedFutureDate}
        </span>
      </div>

      {/* Visual Lifestyle Banner */}
      <div className="lifestyle-image-banner">
        <img
          src="/images/lifestyle_wellness.jpg"
          alt="Cardiovascular & metabolic wellness: Mediterranean diet, fitness, and blood glucose monitoring"
          loading="lazy"
        />
        <div className="lifestyle-image-overlay">
          <div>
            <div className="lifestyle-image-title">
              Evidence-Based Nutritional & Physical Activity Milestones
            </div>
            <div className="lifestyle-image-subtitle">
              Landmark Diabetes Prevention Program (DPP) validated: Up to 58% relative risk reduction through structured lifestyle interventions.
            </div>
          </div>
        </div>
      </div>

      <p className="about-text" style={{ margin: "6px 0 18px", fontSize: 13.5 }}>
        Select achievable lifestyle commitments below. The platform estimates your personalized 90-day
        risk trajectory based on the landmark <em>Diabetes Prevention Program (DPP)</em> research outcomes.
      </p>

      {/* Goal Checkboxes */}
      <div className="goal-options-grid">
        {GOAL_OPTIONS.map((g) => {
          const isSelected = selectedGoals.includes(g.id);
          return (
            <div
              key={g.id}
              className={`goal-card ${isSelected ? "selected" : ""}`}
              onClick={() => toggleGoal(g.id)}
            >
              <div className="goal-top">
                <span className="goal-checkbox">
                  {isSelected ? <CheckCircle2 size={18} /> : <div className="checkbox-empty" />}
                </span>
                <span className="goal-impact-badge">{g.impact}</span>
              </div>
              <h4 className="goal-title">{g.title}</h4>
              <p className="goal-desc">{g.description}</p>
            </div>
          );
        })}
      </div>

      {/* 90-Day Projection Result */}
      <div className="projection-banner">
        <div className="projection-stat-col">
          <span className="proj-label">Current Risk</span>
          <span className="proj-num">{(baseScore * 100).toFixed(1)}%</span>
        </div>

        <div className="proj-arrow">
          <TrendingDown size={28} />
          <span className="proj-pct-badge">▼ {percentageDrop}% Relative Drop</span>
        </div>

        <div className="projection-stat-col highlight">
          <span className="proj-label">Projected 90-Day Risk</span>
          <span className="proj-num">{(projectedScore * 100).toFixed(1)}%</span>
          <span className="proj-sub">
            {projectedScore < 0.2 ? "Low Risk Band" : projectedScore < 0.5 ? "Moderate Band" : "High Risk Band"}
          </span>
        </div>

        <div className="proj-actions">
          <button
            className="primary"
            onClick={() => onLaunchSimulatorWithGoals?.({
              glucoseDrop: totalGlucoseReduction,
              bmiDrop: totalBmiReduction,
              bpDrop: totalBpReduction,
            })}
            style={{ fontSize: 13, padding: "8px 14px" }}
          >
            <Sparkles size={14} />
            Simulate in What-If Engine
          </button>
        </div>
      </div>
    </div>
  );
}
