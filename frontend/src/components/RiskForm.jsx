import { useState } from "react";
import { Loader2, Wand2 } from "lucide-react";

const FIELDS = [
  { key: "pregnancies", label: "Pregnancies", step: 1, placeholder: "0" },
  { key: "glucose", label: "Glucose (mg/dL)", step: 1, placeholder: "120" },
  { key: "blood_pressure", label: "Blood pressure (mmHg)", step: 1, placeholder: "70" },
  { key: "skin_thickness", label: "Skin thickness (mm)", step: 1, placeholder: "20" },
  { key: "insulin", label: "Insulin (mu U/mL)", step: 1, placeholder: "80" },
  { key: "bmi", label: "BMI", step: 0.1, placeholder: "27.5" },
  { key: "diabetes_pedigree", label: "Family history score", step: 0.01, placeholder: "0.4" },
  { key: "age", label: "Age", step: 1, placeholder: "35" },
];

const DEFAULTS = Object.fromEntries(FIELDS.map((f) => [f.key, ""]));

const SAMPLE_PROFILES = [
  { pregnancies: 1, glucose: 105, blood_pressure: 68, skin_thickness: 20, insulin: 75, bmi: 24.2, diabetes_pedigree: 0.25, age: 27 },
  { pregnancies: 4, glucose: 158, blood_pressure: 88, skin_thickness: 33, insulin: 140, bmi: 33.8, diabetes_pedigree: 0.6, age: 46 },
];

export default function RiskForm({ userId, onResult, onError }) {
  const [values, setValues] = useState(DEFAULTS);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  function update(key, val) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  function fillSample() {
    const profile = SAMPLE_PROFILES[Math.floor(Math.random() * SAMPLE_PROFILES.length)];
    const asStrings = Object.fromEntries(
      Object.entries(profile).map(([k, v]) => [k, String(v)])
    );
    setValues(asStrings);
    setTouched(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);

    const missing = FIELDS.some((f) => values[f.key] === "" || values[f.key] === null);
    if (missing) {
      onError?.("Fill in every field before assessing risk.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = { user_id: userId };
      for (const f of FIELDS) payload[f.key] = parseFloat(values[f.key]);
      await onResult(payload);
    } catch (err) {
      onError?.(
        err?.response?.data?.detail
          ? JSON.stringify(err.response.data.detail)
          : "Couldn't reach the prediction service. Is the backend running?"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field-row">
        {FIELDS.map((f) => {
          const invalid = touched && (values[f.key] === "" || values[f.key] === null);
          return (
            <div className="field" key={f.key}>
              <label htmlFor={f.key}>{f.label}</label>
              <input
                id={f.key}
                type="number"
                step={f.step}
                placeholder={f.placeholder}
                value={values[f.key]}
                onChange={(e) => update(f.key, e.target.value)}
                className={invalid ? "invalid" : ""}
              />
            </div>
          );
        })}
      </div>

      <div className="form-actions">
        <button className="primary" type="submit" disabled={submitting}>
          {submitting && <Loader2 size={15} className="spin" />}
          {submitting ? "Assessing…" : "Assess risk"}
        </button>
        <button type="button" className="ghost-btn" onClick={fillSample} disabled={submitting}>
          <Wand2 size={14} />
          Try a sample profile
        </button>
      </div>
    </form>
  );
}
