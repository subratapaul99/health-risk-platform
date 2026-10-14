import { useState } from "react";
import { Loader2, Wand2, Calculator, UserCheck, AlertCircle } from "lucide-react";
import BmiCalculatorModal from "./BmiCalculatorModal.jsx";

const CLINICAL_PERSONAS = [
  {
    id: "prediabetes",
    label: "Case 1: Pre-Diabetes & Metabolic Syndrome (53M)",
    profile: {
      pregnancies: 0,
      glucose: 142,
      blood_pressure: 86,
      skin_thickness: 30,
      insulin: 115,
      bmi: 31.4,
      diabetes_pedigree: 0.48,
      age: 53,
    },
  },
  {
    id: "high_risk",
    label: "Case 2: Acute Glycemic Risk (49F)",
    profile: {
      pregnancies: 3,
      glucose: 178,
      blood_pressure: 92,
      skin_thickness: 38,
      insulin: 165,
      bmi: 36.2,
      diabetes_pedigree: 0.68,
      age: 49,
    },
  },
  {
    id: "familial",
    label: "Case 3: Familial / Genetic Risk (34F)",
    profile: {
      pregnancies: 2,
      glucose: 118,
      blood_pressure: 76,
      skin_thickness: 24,
      insulin: 90,
      bmi: 27.5,
      diabetes_pedigree: 0.88,
      age: 34,
    },
  },
  {
    id: "healthy",
    label: "Case 4: Healthy Baseline Control (28M)",
    profile: {
      pregnancies: 0,
      glucose: 88,
      blood_pressure: 72,
      skin_thickness: 18,
      insulin: 55,
      bmi: 22.4,
      diabetes_pedigree: 0.22,
      age: 28,
    },
  },
];

export default function RiskForm({ userId, onResult, onError, initialValues }) {
  const [values, setValues] = useState({
    pregnancies: initialValues?.pregnancies ?? "",
    glucose: initialValues?.glucose ?? "",
    blood_pressure: initialValues?.blood_pressure ?? "",
    skin_thickness: initialValues?.skin_thickness ?? "",
    insulin: initialValues?.insulin ?? "",
    bmi: initialValues?.bmi ?? "",
    diabetes_pedigree: initialValues?.diabetes_pedigree ?? "",
    age: initialValues?.age ?? "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isBmiModalOpen, setIsBmiModalOpen] = useState(false);

  function update(key, val) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  function handleSelectPersona(e) {
    const personaId = e.target.value;
    if (!personaId) return;
    const persona = CLINICAL_PERSONAS.find((p) => p.id === personaId);
    if (persona) {
      const asStrings = Object.fromEntries(
        Object.entries(persona.profile).map(([k, v]) => [k, String(v)])
      );
      setValues(asStrings);
      setTouched(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);

    const requiredKeys = ["glucose", "blood_pressure", "bmi", "age"];
    const missing = requiredKeys.some((k) => values[k] === "" || values[k] === null);
    if (missing) {
      onError?.("Please complete all essential clinical fields (Glucose, BP, BMI, Age).");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        user_id: userId,
        pregnancies: parseFloat(values.pregnancies) || 0,
        glucose: parseFloat(values.glucose),
        blood_pressure: parseFloat(values.blood_pressure),
        skin_thickness: parseFloat(values.skin_thickness) || 0,
        insulin: parseFloat(values.insulin) || 0,
        bmi: parseFloat(values.bmi),
        diabetes_pedigree: parseFloat(values.diabetes_pedigree) || 0.35,
        age: parseFloat(values.age),
      };
      await onResult(payload);
    } catch (err) {
      onError?.(
        err?.response?.data?.detail
          ? JSON.stringify(err.response.data.detail)
          : "Failed to connect to the prediction service. Please ensure backend is running."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Visual status indicators for biomarkers
  const glucoseVal = parseFloat(values.glucose) || 0;
  const bpVal = parseFloat(values.blood_pressure) || 0;
  const bmiVal = parseFloat(values.bmi) || 0;

  return (
    <>
      <form onSubmit={handleSubmit} className="clinical-intake-form">
        {/* Patient Case Selector */}
        <div className="persona-select-wrap">
          <label className="persona-label">
            <UserCheck size={14} />
            Quick Clinical Case Studies
          </label>
          <select
            className="persona-dropdown"
            onChange={handleSelectPersona}
            defaultValue=""
          >
            <option value="" disabled>Select a patient persona to load record...</option>
            {CLINICAL_PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field-row">
          {/* Glucose */}
          <div className="field">
            <div className="field-label-row">
              <label htmlFor="glucose">Fasting Plasma Glucose (mg/dL)</label>
              {glucoseVal > 0 && (
                <span
                  className={`field-tag ${
                    glucoseVal >= 126 ? "alert" : glucoseVal >= 100 ? "warn" : "normal"
                  }`}
                >
                  {glucoseVal >= 126 ? "Diabetic" : glucoseVal >= 100 ? "Prediabetes" : "Normal"}
                </span>
              )}
            </div>
            <input
              id="glucose"
              type="number"
              step="1"
              placeholder="e.g. 110"
              value={values.glucose}
              onChange={(e) => update("glucose", e.target.value)}
              className={touched && !values.glucose ? "invalid" : ""}
            />
            <span className="field-hint">Normal: &lt;100 | Prediabetes: 100-125 | Alert: &ge;126</span>
          </div>

          {/* Blood Pressure */}
          <div className="field">
            <div className="field-label-row">
              <label htmlFor="blood_pressure">Diastolic BP (mmHg)</label>
              {bpVal > 0 && (
                <span
                  className={`field-tag ${
                    bpVal >= 90 ? "alert" : bpVal >= 80 ? "warn" : "normal"
                  }`}
                >
                  {bpVal >= 90 ? "Stage 2" : bpVal >= 80 ? "Pre-HTN" : "Normal"}
                </span>
              )}
            </div>
            <input
              id="blood_pressure"
              type="number"
              step="1"
              placeholder="e.g. 78"
              value={values.blood_pressure}
              onChange={(e) => update("blood_pressure", e.target.value)}
              className={touched && !values.blood_pressure ? "invalid" : ""}
            />
            <span className="field-hint">Normal: &lt;80 | Pre-HTN: 80-89 | Alert: &ge;90</span>
          </div>

          {/* BMI with Calculator */}
          <div className="field">
            <div className="field-label-row">
              <label htmlFor="bmi">Body Mass Index (BMI)</label>
              <button
                type="button"
                className="bmi-calc-trigger"
                onClick={() => setIsBmiModalOpen(true)}
              >
                <Calculator size={12} />
                Calculate from Ht/Wt
              </button>
            </div>
            <input
              id="bmi"
              type="number"
              step="0.1"
              placeholder="e.g. 28.4"
              value={values.bmi}
              onChange={(e) => update("bmi", e.target.value)}
              className={touched && !values.bmi ? "invalid" : ""}
            />
            <span className="field-hint">Healthy: 18.5-24.9 | Overweight: 25-29.9 | Obese: &ge;30</span>
          </div>

          {/* Age */}
          <div className="field">
            <div className="field-label-row">
              <label htmlFor="age">Patient Age (Years)</label>
            </div>
            <input
              id="age"
              type="number"
              step="1"
              placeholder="e.g. 45"
              value={values.age}
              onChange={(e) => update("age", e.target.value)}
              className={touched && !values.age ? "invalid" : ""}
            />
            <span className="field-hint">Type 2 diabetes risk increases markedly after age 40</span>
          </div>

          {/* Insulin */}
          <div className="field">
            <label htmlFor="insulin">Fasting Insulin (µU/mL)</label>
            <input
              id="insulin"
              type="number"
              step="1"
              placeholder="e.g. 85 (optional)"
              value={values.insulin}
              onChange={(e) => update("insulin", e.target.value)}
            />
            <span className="field-hint">Optional marker. Normal fasting: 15-25 µU/mL</span>
          </div>

          {/* Skin Thickness */}
          <div className="field">
            <label htmlFor="skin_thickness">Triceps Skinfold (mm)</label>
            <input
              id="skin_thickness"
              type="number"
              step="1"
              placeholder="e.g. 23 (optional)"
              value={values.skin_thickness}
              onChange={(e) => update("skin_thickness", e.target.value)}
            />
            <span className="field-hint">Subcutaneous fat measure (median imputed if blank)</span>
          </div>

          {/* Pregnancies */}
          <div className="field">
            <label htmlFor="pregnancies">Prior Pregnancies</label>
            <input
              id="pregnancies"
              type="number"
              step="1"
              placeholder="e.g. 1"
              value={values.pregnancies}
              onChange={(e) => update("pregnancies", e.target.value)}
            />
            <span className="field-hint">Gestational history risk factor (0 if null/male)</span>
          </div>

          {/* Diabetes Pedigree */}
          <div className="field">
            <label htmlFor="diabetes_pedigree">Diabetes Pedigree Score</label>
            <input
              id="diabetes_pedigree"
              type="number"
              step="0.01"
              placeholder="e.g. 0.45"
              value={values.diabetes_pedigree}
              onChange={(e) => update("diabetes_pedigree", e.target.value)}
            />
            <span className="field-hint">Genetic family history: 0.1 (low) to 1.5+ (high)</span>
          </div>
        </div>

        <div className="form-actions">
          <button className="primary" type="submit" disabled={submitting}>
            {submitting && <Loader2 size={15} className="spin" />}
            {submitting ? "Analyzing Biomarkers..." : "Run Clinical Risk Assessment"}
          </button>
        </div>
      </form>

      {/* BMI Modal */}
      <BmiCalculatorModal
        isOpen={isBmiModalOpen}
        onClose={() => setIsBmiModalOpen(false)}
        onApplyBmi={(bmi) => update("bmi", String(bmi))}
      />
    </>
  );
}
