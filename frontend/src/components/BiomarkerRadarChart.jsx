import { useState } from "react";
import { Info } from "lucide-react";

const BIOMARKERS = [
  { key: "glucose", label: "Glucose", normal: 90, max: 200, unit: "mg/dL" },
  { key: "bmi", label: "BMI", normal: 22, max: 45, unit: "kg/m²" },
  { key: "blood_pressure", label: "Blood Pressure", normal: 72, max: 120, unit: "mmHg" },
  { key: "insulin", label: "Insulin", normal: 40, max: 250, unit: "µU/mL" },
  { key: "diabetes_pedigree", label: "Pedigree", normal: 0.3, max: 2.0, unit: "" },
  { key: "age", label: "Age", normal: 30, max: 80, unit: "yrs" },
];

export default function BiomarkerRadarChart({ payload, riskBand = "moderate" }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!payload) return null;

  const size = 320;
  const center = size / 2;
  const radius = center - 45;
  const numAxes = BIOMARKERS.length;
  const angleStep = (Math.PI * 2) / numAxes;

  // Helper to map (angle, normalizedValue 0..1) to (x, y)
  const getCoordinates = (index, normalizedVal) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = Math.max(0.08, Math.min(1.0, normalizedVal)) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // 1. Grid Rings (25%, 50%, 75%, 100%)
  const gridRings = [0.25, 0.5, 0.75, 1.0];

  // 2. Normal reference polygon coordinates
  const normalPoints = BIOMARKERS.map((b, i) => {
    const norm = b.normal / b.max;
    const { x, y } = getCoordinates(i, norm);
    return `${x},${y}`;
  }).join(" ");

  // 3. Patient coordinates
  const patientPoints = BIOMARKERS.map((b, i) => {
    const rawVal = parseFloat(payload[b.key] || 0);
    const norm = Math.min(1.0, Math.max(0.05, rawVal / b.max));
    const { x, y } = getCoordinates(i, norm);
    return `${x},${y}`;
  }).join(" ");

  // Color theme according to patient's risk band
  const polygonColor =
    riskBand === "high"
      ? "rgba(239, 68, 68, 0.35)"
      : riskBand === "moderate"
      ? "rgba(245, 158, 11, 0.35)"
      : "rgba(13, 148, 136, 0.35)";

  const strokeColor =
    riskBand === "high" ? "#dc2626" : riskBand === "moderate" ? "#d97706" : "#0d9488";

  return (
    <div className="radar-chart-container">
      <div className="radar-header">
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
            Biomarker Footprint vs. Clinical Norms
          </h3>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
            Multi-axis metabolic radar comparing patient vitals against normal targets.
          </p>
        </div>
        <div className="radar-legend">
          <span className="legend-item">
            <span className="legend-box" style={{ background: "rgba(16, 185, 129, 0.2)", borderColor: "#10b981" }} />
            Clinical Target
          </span>
          <span className="legend-item">
            <span className="legend-box" style={{ background: polygonColor, borderColor: strokeColor }} />
            Patient Vitals
          </span>
        </div>
      </div>

      <div className="radar-svg-wrapper">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="radar-svg">
          {/* Concentric grid circles */}
          {gridRings.map((r, idx) => (
            <circle
              key={idx}
              cx={center}
              cy={center}
              r={radius * r}
              fill="none"
              stroke="var(--hairline)"
              strokeDasharray={idx === gridRings.length - 1 ? "none" : "2,3"}
              strokeWidth="0.8"
            />
          ))}

          {/* Radial axis lines */}
          {BIOMARKERS.map((_, i) => {
            const { x, y } = getCoordinates(i, 1.0);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="var(--hairline)"
                strokeWidth="1"
              />
            );
          })}

          {/* Clinical Normal Target Polygon */}
          <polygon
            points={normalPoints}
            fill="rgba(16, 185, 129, 0.15)"
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="3,3"
          />

          {/* Patient Vitals Polygon */}
          <polygon
            points={patientPoints}
            fill={polygonColor}
            stroke={strokeColor}
            strokeWidth="2.2"
          />

          {/* Patient Value Dots & Interactive Hover */}
          {BIOMARKERS.map((b, i) => {
            const rawVal = parseFloat(payload[b.key] || 0);
            const norm = Math.min(1.0, Math.max(0.05, rawVal / b.max));
            const { x, y } = getCoordinates(i, norm);
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill="#ffffff"
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  style={{ cursor: "pointer", transition: "r 0.2s" }}
                  onMouseEnter={() => setHoveredPoint({ ...b, currentVal: rawVal, x, y })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}

          {/* Axis Labels */}
          {BIOMARKERS.map((b, i) => {
            const { x, y } = getCoordinates(i, 1.18);
            const isRight = x > center + 10;
            const isLeft = x < center - 10;
            const textAnchor = isRight ? "start" : isLeft ? "end" : "middle";
            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor={textAnchor}
                fontSize="10"
                fontWeight="600"
                fill="var(--text)"
                alignmentBaseline="middle"
              >
                {b.label}
              </text>
            );
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {hoveredPoint && (
          <div
            className="radar-tooltip"
            style={{
              left: Math.min(size - 130, Math.max(10, hoveredPoint.x - 60)),
              top: Math.max(10, hoveredPoint.y - 45),
            }}
          >
            <strong>{hoveredPoint.label}</strong>: {hoveredPoint.currentVal} {hoveredPoint.unit}
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
              Target: &le; {hoveredPoint.normal} {hoveredPoint.unit}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
