import { CheckCircle2, AlertTriangle, ShieldAlert, Sparkles, Target } from "lucide-react";

export default function RecommendationCard({ recommendations, riskBand }) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="empty-state">
        Submit an assessment to generate evidence-based clinical and lifestyle interventions.
      </div>
    );
  }

  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return <span className="rec-badge high"><ShieldAlert size={12} /> High Priority</span>;
      case "moderate":
        return <span className="rec-badge moderate"><AlertTriangle size={12} /> Moderate</span>;
      default:
        return <span className="rec-badge low"><CheckCircle2 size={12} /> Preventive</span>;
    }
  };

  return (
    <div className="recommendations-container">
      <div className="recommendation-header-note">
        <Sparkles size={16} />
        <span>Prioritized guidance mapped to patient biomarker drivers (ADA Standards of Care)</span>
      </div>

      <div className="recommendation-list">
        {recommendations.map((rec, idx) => (
          <div key={idx} className={`rec-card priority-${rec.priority?.toLowerCase() || "low"}`}>
            <div className="rec-top-row">
              <span className="rec-category">{rec.category}</span>
              {getPriorityBadge(rec.priority)}
            </div>

            <h3 className="rec-title">{rec.title}</h3>
            <p className="rec-action">{rec.action}</p>

            {rec.target && (
              <div className="rec-target-badge">
                <Target size={13} />
                <span>{rec.target}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
