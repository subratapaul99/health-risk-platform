import { History as HistoryIcon } from "lucide-react";
import TrendChart from "./TrendChart.jsx";

const BAND_LABEL = { low: "Low", moderate: "Moderate", high: "High" };

export default function HistoryView({ history }) {
  return (
    <div className="view-page">
      <div className="view-header">
        <h1>
          <HistoryIcon size={24} />
          Assessment history
        </h1>
        <p>Every risk assessment submitted in this session, most recent last.</p>
      </div>

      <div className="panel" style={{ marginBottom: 24 }}>
        <h2>Risk trend</h2>
        <TrendChart history={history} />
      </div>

      <div className="panel">
        <h2>All assessments</h2>
        {history.length === 0 ? (
          <div className="empty-state">No assessments submitted yet.</div>
        ) : (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Risk score</th>
                  <th>Band</th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((h, i) => (
                  <tr key={h.submission_id}>
                    <td>{history.length - i}</td>
                    <td>{new Date(h.created_at).toLocaleString()}</td>
                    <td>{Math.round(h.risk_score * 100)}%</td>
                    <td>
                      <span className={`risk-band ${h.risk_band}`}>
                        {BAND_LABEL[h.risk_band] || h.risk_band}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
