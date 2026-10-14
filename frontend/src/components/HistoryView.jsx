import { History as HistoryIcon, Download, Printer, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import TrendChart from "./TrendChart.jsx";
import { getHistoryExportCsvUrl } from "../api.js";

const BAND_LABEL = { low: "Low Risk", moderate: "Moderate Risk", high: "High Risk" };

export default function HistoryView({ history, userId = "demo_user" }) {
  const exportUrl = getHistoryExportCsvUrl(userId);

  return (
    <div className="view-page">
      <div className="view-header">
        <div>
          <h1>
            <HistoryIcon size={24} />
            Longitudinal Assessment Trajectory
          </h1>
          <p>
            Chronological log of all recorded clinical assessments for Patient ID: <strong>{userId}</strong>.
            Export records for EHR integration or longitudinal progress monitoring.
          </p>
        </div>

        <div className="sim-header-actions no-print">
          {history.length > 0 && (
            <a href={exportUrl} download className="export-btn" target="_blank" rel="noreferrer">
              <Download size={15} />
              Export CSV Dataset
            </a>
          )}
          <button className="export-btn" onClick={() => window.print()}>
            <Printer size={15} />
            Print Trajectory
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 24 }}>
        <h2>
          <TrendingUp size={18} />
          Risk Trajectory Curve
        </h2>
        <TrendChart history={history} />
      </div>

      <div className="panel">
        <h2>
          <Calendar size={18} />
          Historical Clinical Assessments Log
        </h2>
        {history.length === 0 ? (
          <div className="empty-state">
            No assessments submitted yet. Fill out the dashboard form to record a new assessment.
          </div>
        ) : (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Submission #</th>
                  <th>Timestamp</th>
                  <th>Predicted Probability</th>
                  <th>Clinical Risk Band</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((h, i) => (
                  <tr key={h.submission_id}>
                    <td><code>#{h.submission_id}</code></td>
                    <td>{new Date(h.created_at).toLocaleString()}</td>
                    <td>
                      <strong style={{ fontSize: 15 }}>{(h.risk_score * 100).toFixed(1)}%</strong>
                    </td>
                    <td>
                      <span className={`risk-band ${h.risk_band}`}>
                        {BAND_LABEL[h.risk_band] || h.risk_band}
                      </span>
                    </td>
                    <td>
                      {h.risk_band === "high" ? (
                        <span className="rec-badge high" style={{ fontSize: 11 }}>Action Required</span>
                      ) : h.risk_band === "moderate" ? (
                        <span className="rec-badge moderate" style={{ fontSize: 11 }}>Monitoring</span>
                      ) : (
                        <span className="rec-badge low" style={{ fontSize: 11 }}>Optimal</span>
                      )}
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
