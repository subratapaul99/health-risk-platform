import RiskGauge from "./RiskGauge.jsx";

export default function RiskScoreCard({ result, loading }) {
  if (loading) {
    return (
      <div className="skeleton-gauge-wrap">
        <div className="skeleton skeleton-circle" />
        <div className="skeleton skeleton-line" style={{ width: "40%" }} />
        <div className="skeleton skeleton-line" style={{ width: "70%" }} />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="empty-state">
        Fill in the assessment to see a risk score and explanation here.
      </div>
    );
  }

  return (
    <div>
      <RiskGauge score={result.risk_score} band={result.risk_band} />
      <div className="risk-meta">
        <span className={`risk-band ${result.risk_band}`}>
          {result.risk_band} risk
        </span>
        <span className="risk-caption">
          Higher than {result.percentile}% of assessed profiles
        </span>
        <div className="percentile-bar-track" style={{ width: "100%" }}>
          <div
            className="percentile-bar-fill"
            style={{ width: `${result.percentile}%` }}
          />
        </div>
      </div>
    </div>
  );
}
