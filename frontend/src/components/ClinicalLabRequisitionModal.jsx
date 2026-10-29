import { useState } from "react";
import {
  FileCheck2,
  X,
  Printer,
  Calendar,
  User,
  Stethoscope,
  AlertCircle,
  CheckSquare,
  Square,
  ShieldAlert,
} from "lucide-react";

const STANDARD_LABS = [
  {
    id: "hba1c",
    code: "CPT 83036",
    title: "Hemoglobin A1c (HbA1c Assay)",
    desc: "Evaluates 3-month average glycemic control. Gold standard for diabetes & prediabetes confirmation.",
    defaultChecked: true,
  },
  {
    id: "cmp",
    code: "CPT 80053",
    title: "Comprehensive Metabolic Panel (CMP - Fasting)",
    desc: "14-marker panel assessing glucose, liver enzymes (ALT/AST), electrolytes, and kidney function (BUN/Creatinine).",
    defaultChecked: true,
  },
  {
    id: "lipid",
    code: "CPT 80061",
    title: "Fasting Lipid Profile (Cardiovascular Risk)",
    desc: "Total Cholesterol, HDL, LDL, and Triglycerides. Essential for assessing metabolic syndrome dyslipidemia.",
    defaultChecked: true,
  },
  {
    id: "insulin_homa",
    code: "CPT 83525",
    title: "Fasting Serum Insulin & HOMA-IR Panel",
    desc: "Quantifies beta-cell secretory capacity and peripheral insulin resistance before irreversible pancreatic exhaustion.",
    defaultChecked: true,
  },
  {
    id: "uacr",
    code: "CPT 82043",
    title: "Urine Microalbumin / Creatinine Ratio (uACR)",
    desc: "Early detection of diabetic nephropathy and microvascular renal endothelial injury.",
    defaultChecked: false,
  },
  {
    id: "egfr",
    code: "CPT 82565",
    title: "eGFR & Renal Function Assessment",
    desc: "Calculates Glomerular Filtration Rate to establish baseline renal clearance prior to pharmacotherapy.",
    defaultChecked: false,
  },
];

export default function ClinicalLabRequisitionModal({
  isOpen,
  onClose,
  result,
  payload,
  userId,
}) {
  const [selectedLabs, setSelectedLabs] = useState(["hba1c", "cmp", "lipid", "insulin_homa"]);
  const [priority, setPriority] = useState("Routine (Within 48h)");
  const [physicianName, setPhysicianName] = useState("Dr. Jane Smith, MD - Endocrinology");
  const [licenseNo, setLicenseNo] = useState("MED-IL-89241");

  if (!isOpen) return null;

  const toggleLab = (id) => {
    setSelectedLabs((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const reqId = `REQ-${Math.floor(100000 + Math.random() * 900000)}`;

  // Determine applicable ICD-10 diagnostic billing codes
  const icdCodes = [];
  const glucose = payload?.glucose || 0;
  const bmi = payload?.bmi || 0;
  const bp = payload?.blood_pressure || 0;

  if (glucose >= 126) {
    icdCodes.push({ code: "E11.9", desc: "Type 2 Diabetes Mellitus without complications" });
  } else if (glucose >= 100) {
    icdCodes.push({ code: "R73.03", desc: "Prediabetes / Impaired Fasting Glucose" });
  } else {
    icdCodes.push({ code: "Z13.1", desc: "Special Screening Encounter for Diabetes Mellitus" });
  }

  if (bmi >= 30) {
    icdCodes.push({ code: "E66.01", desc: "Morbid (Class 1) Obesity due to excess calories" });
  }
  if (bp >= 85) {
    icdCodes.push({ code: "I10", desc: "Essential (Primary) Hypertension Surveillance" });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card requisition-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header no-print">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FileCheck2 size={22} color="var(--brand)" />
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>Clinical Laboratory Order Requisition</h2>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Hospital & Outpatient Diagnostic Lab Requisition Slip
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="primary" onClick={() => window.print()} style={{ fontSize: 13, padding: "6px 14px" }}>
              <Printer size={15} />
              Print Requisition
            </button>
            <button className="ghost-btn icon-only" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Requisition Slip */}
        <div className="requisition-printable-sheet">
          <div className="requisition-top-bar">
            <div>
              <div className="req-hospital-title">METROPOLITAN CLINICAL HEALTH SYSTEM</div>
              <div className="req-hospital-sub">Department of Endocrinology & Metabolic Health</div>
            </div>
            <div className="req-slip-meta">
              <div><strong>Requisition #:</strong> {reqId}</div>
              <div><strong>Date:</strong> {currentDate}</div>
              <div><strong>Urgency:</strong> <span className="urgency-tag">{priority}</span></div>
            </div>
          </div>

          {/* Patient Demographic Banner */}
          <div className="req-patient-grid">
            <div className="req-data-cell">
              <span className="req-label">Patient ID:</span>
              <span className="req-val">{userId || "PT-DEMO-001"}</span>
            </div>
            <div className="req-data-cell">
              <span className="req-label">Age / Gender:</span>
              <span className="req-val">{payload?.age ? `${payload.age} Years / Clinical File` : "45 Years / Adult"}</span>
            </div>
            <div className="req-data-cell">
              <span className="req-label">Current BMI:</span>
              <span className="req-val">{payload?.bmi ? `${payload.bmi} kg/m²` : "28.5 kg/m²"}</span>
            </div>
            <div className="req-data-cell">
              <span className="req-label">Screening Risk:</span>
              <span className="req-val" style={{ fontWeight: 700, color: "var(--brand)" }}>
                {result?.risk_score ? `${(result.risk_score * 100).toFixed(1)}% (${result.risk_band?.toUpperCase()})` : "Moderate Risk"}
              </span>
            </div>
          </div>

          {/* Diagnostic ICD-10 Billing Indications */}
          <div className="req-section-title">Primary Diagnostic Indications (ICD-10 Clinical Coding)</div>
          <div className="icd-chips-row">
            {icdCodes.map((icd) => (
              <div key={icd.code} className="icd-badge-pill">
                <strong>{icd.code}</strong> — {icd.desc}
              </div>
            ))}
          </div>

          {/* Laboratory Tests Selection */}
          <div className="req-section-title" style={{ marginTop: 14 }}>
            Requested Laboratory Diagnostic Tests (Fasting 10-12 Hours Required)
          </div>

          <div className="req-labs-list">
            {STANDARD_LABS.map((lab) => {
              const isChecked = selectedLabs.includes(lab.id);
              return (
                <div
                  key={lab.id}
                  className={`req-lab-row ${isChecked ? "selected" : ""}`}
                  onClick={() => toggleLab(lab.id)}
                >
                  <div className="req-checkbox">
                    {isChecked ? <CheckSquare size={16} color="var(--brand)" /> : <Square size={16} />}
                  </div>
                  <div className="req-lab-info">
                    <div className="req-lab-heading">
                      <strong>{lab.title}</strong>
                      <span className="cpt-code">{lab.code}</span>
                    </div>
                    <p className="req-lab-desc">{lab.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Special Instructions & Fasting Protocol */}
          <div className="req-fasting-note">
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              <strong>Pre-Analytical Patient Preparation:</strong> Patient must maintain strict overnight fast (10-12 hours).
              Water is permitted. Morning medications may be taken with water unless instructed otherwise.
            </span>
          </div>

          {/* Physician Authorization Footer */}
          <div className="req-footer-signatures">
            <div className="req-sig-block">
              <span className="req-sig-label">Ordering Clinician:</span>
              <div className="req-physician-info">
                <strong>{physicianName}</strong>
                <div>License: {licenseNo} | NPI: 1948201948</div>
              </div>
            </div>
            <div className="req-sig-block" style={{ textAlign: "right" }}>
              <span className="req-sig-label">Electronic Signature Authorization:</span>
              <div className="req-e-signature">
                Electronically Signed by <em>{physicianName}</em>
                <div style={{ fontSize: 10, color: "#64748b" }}>Audit Timestamp: {new Date().toISOString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
