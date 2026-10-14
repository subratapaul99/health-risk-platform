import { useState } from "react";
import { X, Calculator, Check, ArrowRight } from "lucide-react";

export default function BmiCalculatorModal({ isOpen, onClose, onApplyBmi }) {
  const [unitSystem, setUnitSystem] = useState("metric"); // metric or imperial

  // Metric
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState(78);

  // Imperial
  const [heightFeet, setHeightFeet] = useState(5);
  const [heightInches, setHeightInches] = useState(9);
  const [weightLbs, setWeightLbs] = useState(172);

  if (!isOpen) return null;

  let calculatedBmi = 0;
  if (unitSystem === "metric") {
    const heightM = (heightCm || 1) / 100;
    calculatedBmi = (weightKg || 0) / (heightM * heightM);
  } else {
    const totalInches = (heightFeet || 0) * 12 + (heightInches || 0);
    calculatedBmi = totalInches > 0 ? ((weightLbs || 0) / (totalInches * totalInches)) * 703 : 0;
  }

  calculatedBmi = Number(calculatedBmi.toFixed(1));

  let category = "Normal weight";
  let categoryColor = "var(--risk-low)";
  let categoryBg = "var(--risk-low-bg)";

  if (calculatedBmi < 18.5) {
    category = "Underweight";
    categoryColor = "var(--ink-muted)";
    categoryBg = "var(--surface-2)";
  } else if (calculatedBmi >= 18.5 && calculatedBmi < 25) {
    category = "Healthy / Normal";
    categoryColor = "var(--risk-low)";
    categoryBg = "var(--risk-low-bg)";
  } else if (calculatedBmi >= 25 && calculatedBmi < 30) {
    category = "Overweight";
    categoryColor = "var(--risk-moderate)";
    categoryBg = "var(--risk-moderate-bg)";
  } else if (calculatedBmi >= 30 && calculatedBmi < 35) {
    category = "Obesity Class I";
    categoryColor = "var(--risk-high)";
    categoryBg = "var(--risk-high-bg)";
  } else {
    category = "Obesity Class II+";
    categoryColor = "var(--risk-high)";
    categoryBg = "var(--risk-high-bg)";
  }

  const handleApply = () => {
    onApplyBmi(calculatedBmi);
    onClose();
  };

  return (
    <div className="modal-scrim">
      <div className="modal-panel bmi-modal">
        <div className="modal-header">
          <div className="modal-title-row">
            <Calculator size={20} />
            <h2>Clinical BMI & Body Composition Calculator</h2>
          </div>
          <button className="toast-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Unit Toggle */}
        <div className="unit-toggle-wrap">
          <button
            type="button"
            className={`unit-toggle-btn ${unitSystem === "metric" ? "active" : ""}`}
            onClick={() => setUnitSystem("metric")}
          >
            Metric (cm / kg)
          </button>
          <button
            type="button"
            className={`unit-toggle-btn ${unitSystem === "imperial" ? "active" : ""}`}
            onClick={() => setUnitSystem("imperial")}
          >
            US / Imperial (ft / in / lbs)
          </button>
        </div>

        {/* Inputs */}
        <div className="bmi-input-grid">
          {unitSystem === "metric" ? (
            <>
              <div className="field">
                <label>Height (cm)</label>
                <input
                  type="number"
                  min="100"
                  max="250"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="text-input"
                />
              </div>
              <div className="field">
                <label>Weight (kg)</label>
                <input
                  type="number"
                  min="30"
                  max="250"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="text-input"
                />
              </div>
            </>
          ) : (
            <>
              <div className="field-row">
                <div className="field">
                  <label>Feet</label>
                  <input
                    type="number"
                    min="3"
                    max="7"
                    value={heightFeet}
                    onChange={(e) => setHeightFeet(Number(e.target.value))}
                    className="text-input"
                  />
                </div>
                <div className="field">
                  <label>Inches</label>
                  <input
                    type="number"
                    min="0"
                    max="11"
                    value={heightInches}
                    onChange={(e) => setHeightInches(Number(e.target.value))}
                    className="text-input"
                  />
                </div>
              </div>
              <div className="field">
                <label>Weight (pounds / lbs)</label>
                <input
                  type="number"
                  min="60"
                  max="500"
                  value={weightLbs}
                  onChange={(e) => setWeightLbs(Number(e.target.value))}
                  className="text-input"
                />
              </div>
            </>
          )}
        </div>

        {/* BMI Outcome Preview */}
        <div className="bmi-result-card" style={{ borderColor: categoryColor }}>
          <div className="bmi-val-wrap">
            <span className="bmi-label">Calculated BMI</span>
            <span className="bmi-score" style={{ color: categoryColor }}>
              {calculatedBmi || "--"}
            </span>
            <span className="bmi-unit">kg/m²</span>
          </div>

          <div
            className="bmi-category-badge"
            style={{ color: categoryColor, background: categoryBg }}
          >
            {category}
          </div>
        </div>

        {/* WHO Reference Scale */}
        <div className="bmi-scale-bar">
          <div className="scale-segment under" title="Underweight (<18.5)">Under</div>
          <div className="scale-segment normal" title="Normal (18.5 - 24.9)">Normal</div>
          <div className="scale-segment over" title="Overweight (25 - 29.9)">Overweight</div>
          <div className="scale-segment obese" title="Obese (30+)">Obese</div>
        </div>

        <div className="auth-form-actions" style={{ marginTop: 20 }}>
          <button type="button" className="primary" onClick={handleApply} style={{ width: "100%" }}>
            <Check size={16} />
            Apply {calculatedBmi} BMI to Patient Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
