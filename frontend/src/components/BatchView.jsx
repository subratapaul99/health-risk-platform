import { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, Download, Loader2 } from "lucide-react";
import { submitBatch } from "../api.js";

const SAMPLE_CSV = `patient_id,pregnancies,glucose,blood_pressure,skin_thickness,insulin,bmi,diabetes_pedigree,age
P001,1,105,68,20,75,24.2,0.25,27
P002,4,158,88,33,140,33.8,0.6,46
P003,0,90,60,15,50,21.0,0.15,22
`;

const BAND_LABEL = { low: "Low", moderate: "Moderate", high: "High" };

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function resultsToCsv(response) {
  const header = "row,patient_id,risk_score,risk_band,percentile,top_factors,error\n";
  const rows = response.results.map((r) =>
    [
      r.row,
      r.patient_id ?? "",
      r.risk_score ?? "",
      r.risk_band ?? "",
      r.percentile ?? "",
      `"${(r.top_factors || []).join("; ")}"`,
      r.error ? `"${r.error}"` : "",
    ].join(",")
  );
  return header + rows.join("\n");
}

export default function BatchView({ onError }) {
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  function handleFilePick(e) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setResult(null);
    }
  }

  async function handleUpload() {
    if (!file) return;
    setSubmitting(true);
    try {
      const response = await submitBatch(file);
      setResult(response);
    } catch (err) {
      onError?.(
        err?.response?.data?.detail || "Couldn't process that CSV. Check the format and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="view-page">
      <div className="view-header">
        <div>
          <h1>
            <FileSpreadsheet size={24} />
            Batch screening
          </h1>
          <p>
            Upload a CSV of patients to get a risk assessment for every row at
            once — useful for a clinic or health camp screening many people
            in one pass.
          </p>
        </div>
        <button
          className="ghost-btn no-print"
          onClick={() => downloadText("sample_patients.csv", SAMPLE_CSV)}
        >
          <Download size={14} />
          Sample CSV
        </button>
      </div>

      <div className="panel" style={{ marginBottom: 24 }}>
        <h2>
          <UploadCloud size={17} />
          Upload
        </h2>
        <p className="about-text" style={{ marginBottom: 14 }}>
          Required columns: <code>pregnancies, glucose, blood_pressure,
          skin_thickness, insulin, bmi, diabetes_pedigree, age</code>. An
          optional <code>patient_id</code> column is used to label results.
          Up to 500 rows per file.
        </p>

        <div className="form-actions">
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            onChange={handleFilePick}
            style={{ display: "none" }}
          />
          <button
            type="button"
            className="ghost-btn"
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud size={14} />
            {file ? file.name : "Choose CSV file"}
          </button>
          <button
            className="primary"
            disabled={!file || submitting}
            onClick={handleUpload}
          >
            {submitting && <Loader2 size={15} className="spin" />}
            {submitting ? "Processing…" : "Run batch assessment"}
          </button>
        </div>
      </div>

      {result && (
        <div className="panel">
          <h2>Results</h2>
          <div className="metric-grid" style={{ marginBottom: 20 }}>
            <div className="metric-tile">
              <span className="metric-value">{result.total_rows}</span>
              <span className="metric-label">Total rows</span>
            </div>
            <div className="metric-tile">
              <span className="metric-value">{result.successful}</span>
              <span className="metric-label">Successful</span>
            </div>
            <div className="metric-tile">
              <span className="metric-value">{result.failed}</span>
              <span className="metric-label">Failed</span>
            </div>
          </div>

          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Patient</th>
                  <th>Risk</th>
                  <th>Band</th>
                  <th>Top factors</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((r) => (
                  <tr key={r.row}>
                    <td>{r.row}</td>
                    <td>{r.patient_id || "—"}</td>
                    {r.error ? (
                      <td colSpan={3} style={{ color: "var(--risk-high)" }}>
                        {r.error}
                      </td>
                    ) : (
                      <>
                        <td>{Math.round(r.risk_score * 100)}%</td>
                        <td>
                          <span className={`risk-band ${r.risk_band}`}>
                            {BAND_LABEL[r.risk_band] || r.risk_band}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                          {r.top_factors.join(", ")}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            className="export-btn no-print"
            style={{ marginTop: 18 }}
            onClick={() => downloadText("batch_results.csv", resultsToCsv(result))}
          >
            <Download size={15} />
            Download results CSV
          </button>
        </div>
      )}
    </div>
  );
}
