import { ClipboardList, Gauge, Sparkles, TrendingUp, Printer } from "lucide-react";
import RiskForm from "./RiskForm.jsx";
import RiskScoreCard from "./RiskScoreCard.jsx";
import ShapExplanation from "./ShapExplanation.jsx";
import TrendChart from "./TrendChart.jsx";

export default function DashboardView({ result, history, loading, onSubmit, onError, userId }) {
  return (
    <div className="view-page">
      <div className="view-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            Enter a set of health measurements to estimate diabetes risk, see
            which factors drove the estimate, and track how risk changes across
            assessments.
          </p>
        </div>
        {result && (
          <button className="export-btn no-print" onClick={() => window.print()}>
            <Printer size={15} />
            Export report
          </button>
        )}
      </div>

      <div className="grid two-col">
        <div className="panel">
          <h2>
            <ClipboardList size={17} />
            New assessment
          </h2>
          <RiskForm userId={userId} onResult={onSubmit} onError={onError} />
        </div>

        <div className="panel">
          <h2>
            <Gauge size={17} />
            Risk estimate
          </h2>
          <RiskScoreCard result={result} loading={loading} />
        </div>
      </div>

      <div className="grid two-col" style={{ marginTop: 28 }}>
        <div className="panel">
          <h2>
            <Sparkles size={17} />
            What drove this estimate
          </h2>
          <ShapExplanation result={result} loading={loading} />
        </div>

        <div className="panel">
          <h2>
            <TrendingUp size={17} />
            Risk over time
          </h2>
          <TrendChart history={history} />
        </div>
      </div>
    </div>
  );
}
