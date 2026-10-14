import { useState, useEffect } from "react";
import { Sliders, RefreshCw, ArrowDownRight, ArrowUpRight, Sparkles, CheckCircle, Flame } from "lucide-react";
import RiskGauge from "./RiskGauge.jsx";
import { simulateRisk } from "../api.js";

const DEFAULT_BASELINE = {
  user_id: "demo_user",
  pregnancies: 2,
  glucose: 145,
  blood_pressure: 84,
  skin_thickness: 28,
  insulin: 110,
  bmi: 33.5,
  diabetes_pedigree: 0.52,
  age: 42,
};

export default function SimulationView({ latestAssessment, onApplyToForm }) {
  const baseline = latestAssessment || DEFAULT_BASELINE;

  const [glucose, setGlucose] = useState(Math.round(baseline.glucose || 145));
  const [bmi, setBmi] = useState(Number((baseline.bmi || 33.5).toFixed(1)));
  const [bloodPressure, setBloodPressure] = useState(Math.round(baseline.blood_pressure || 84));
  const [insulin, setInsulin] = useState(Math.round(baseline.insulin || 110));

  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sync sliders if baseline assessment changes
  useEffect(() => {
    if (latestAssessment) {
      setGlucose(Math.round(latestAssessment.glucose || 145));
      setBmi(Number((latestAssessment.bmi || 33.5).toFixed(1)));
      setBloodPressure(Math.round(latestAssessment.blood_pressure || 84));
      setInsulin(Math.round(latestAssessment.insulin || 110));
    }
  }, [latestAssessment]);

  // Run simulation whenever sliders move (debounced or on change)
  useEffect(() => {
    let active = true;
    const runSim = async () => {
      setLoading(true);
      try {
        const payload = {
          baseline: {
            user_id: baseline.user_id || "demo_user",
            pregnancies: baseline.pregnancies || 0,
            glucose: baseline.glucose || 140,
            blood_pressure: baseline.blood_pressure || 80,
            skin_thickness: baseline.skin_thickness || 20,
            insulin: baseline.insulin || 100,
            bmi: baseline.bmi || 30,
            diabetes_pedigree: baseline.diabetes_pedigree || 0.35,
            age: baseline.age || 40,
          },
          modified_glucose: glucose,
          modified_bmi: bmi,
          modified_blood_pressure: bloodPressure,
          modified_insulin: insulin,
        };
        const data = await simulateRisk(payload);
        if (active) setSimResult(data);
      } catch (err) {
        console.error("Simulation error:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    const timeout = setTimeout(runSim, 200);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [glucose, bmi, bloodPressure, insulin, baseline]);

  const handleResetToBaseline = () => {
    setGlucose(Math.round(baseline.glucose || 145));
    setBmi(Number((baseline.bmi || 33.5).toFixed(1)));
    setBloodPressure(Math.round(baseline.blood_pressure || 84));
    setInsulin(Math.round(baseline.insulin || 110));
  };

  const handleTargetPreset = (targetType) => {
    if (targetType === "optimal") {
      setGlucose(92);
      setBmi(23.5);
      setBloodPressure(72);
      setInsulin(85);
    } else if (targetType === "moderate_loss") {
      setGlucose(Math.max(100, Math.round((baseline.glucose || 140) * 0.85)));
      setBmi(Math.max(25, Number(((baseline.bmi || 30) * 0.92).toFixed(1))));
      setBloodPressure(Math.max(76, Math.round((baseline.blood_pressure || 80) * 0.92)));
    }
  };

  const isRiskReduced = simResult && simResult.risk_delta < 0;
  const isRiskIncreased = simResult && simResult.risk_delta > 0;

  return (
    <div className="view-page simulation-page">
      <div className="view-header">
        <div>
          <h1>
            <Sliders size={24} />
            Interactive "What-If" Counterfactual Risk Simulator
          </h1>
          <p>
            Adjust controllable health biomarkers below in real time. The underlying ML inference
            model immediately evaluates how specific dietary or weight interventions alter your
            predicted probability and risk category.
          </p>
        </div>

        <div className="sim-header-actions no-print">
          <button className="ghost-btn" onClick={() => handleTargetPreset("optimal")}>
            <Sparkles size={14} />
            Optimal Target
          </button>
          <button className="ghost-btn" onClick={() => handleTargetPreset("moderate_loss")}>
            <CheckCircle size={14} />
            -8% Weight / Diet Target
          </button>
          <button className="ghost-btn" onClick={handleResetToBaseline}>
            <RefreshCw size={14} />
            Reset to Baseline
          </button>
        </div>
      </div>

      <div className="grid two-col">
        {/* Sliders Panel */}
        <div className="panel sim-controls-panel">
          <h2>
            <Sliders size={18} />
            Modifiable Biomarkers
          </h2>

          <div className="sim-slider-group">
            <div className="slider-header">
              <label>Fasting Plasma Glucose (mg/dL)</label>
              <div className="slider-value-box">
                <span className="slider-val">{glucose}</span>
                <span className="slider-unit">mg/dL</span>
                {baseline.glucose && (
                  <span className="slider-diff">
                    ({glucose - Math.round(baseline.glucose) >= 0 ? "+" : ""}
                    {glucose - Math.round(baseline.glucose)})
                  </span>
                )}
              </div>
            </div>
            <input
              type="range"
              min="70"
              max="240"
              step="1"
              value={glucose}
              onChange={(e) => setGlucose(Number(e.target.value))}
              className="sim-slider"
            />
            <div className="slider-ticks">
              <span>70 (Normal)</span>
              <span>100 (Prediabetic)</span>
              <span>126+ (Diabetic threshold)</span>
              <span>240</span>
            </div>
          </div>

          <div className="sim-slider-group" style={{ marginTop: 22 }}>
            <div className="slider-header">
              <label>Body Mass Index (BMI)</label>
              <div className="slider-value-box">
                <span className="slider-val">{bmi}</span>
                <span className="slider-unit">kg/m²</span>
                {baseline.bmi && (
                  <span className="slider-diff">
                    ({bmi - baseline.bmi >= 0 ? "+" : ""}
                    {(bmi - baseline.bmi).toFixed(1)})
                  </span>
                )}
              </div>
            </div>
            <input
              type="range"
              min="18.5"
              max="50"
              step="0.5"
              value={bmi}
              onChange={(e) => setBmi(Number(e.target.value))}
              className="sim-slider"
            />
            <div className="slider-ticks">
              <span>18.5 (Normal)</span>
              <span>25 (Overweight)</span>
              <span>30 (Obese)</span>
              <span>50</span>
            </div>
          </div>

          <div className="sim-slider-group" style={{ marginTop: 22 }}>
            <div className="slider-header">
              <label>Diastolic Blood Pressure (mmHg)</label>
              <div className="slider-value-box">
                <span className="slider-val">{bloodPressure}</span>
                <span className="slider-unit">mmHg</span>
                {baseline.blood_pressure && (
                  <span className="slider-diff">
                    ({bloodPressure - Math.round(baseline.blood_pressure) >= 0 ? "+" : ""}
                    {bloodPressure - Math.round(baseline.blood_pressure)})
                  </span>
                )}
              </div>
            </div>
            <input
              type="range"
              min="60"
              max="130"
              step="1"
              value={bloodPressure}
              onChange={(e) => setBloodPressure(Number(e.target.value))}
              className="sim-slider"
            />
            <div className="slider-ticks">
              <span>60 (Normal)</span>
              <span>80 (Pre-HTN)</span>
              <span>90+ (Stage 2)</span>
              <span>130</span>
            </div>
          </div>

          <div className="sim-slider-group" style={{ marginTop: 22 }}>
            <div className="slider-header">
              <label>Serum Insulin (µU/mL)</label>
              <div className="slider-value-box">
                <span className="slider-val">{insulin}</span>
                <span className="slider-unit">µU/mL</span>
              </div>
            </div>
            <input
              type="range"
              min="15"
              max="350"
              step="5"
              value={insulin}
              onChange={(e) => setInsulin(Number(e.target.value))}
              className="sim-slider"
            />
            <div className="slider-ticks">
              <span>15 (Fasting normal)</span>
              <span>100</span>
              <span>250+ (Hyperinsulinemia)</span>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="panel sim-results-panel">
          <h2>
            <Flame size={18} />
            Simulated Outcome Comparison
          </h2>

          {simResult ? (
            <div className="sim-comparison-wrap">
              <div className="sim-gauges-row">
                <div className="sim-gauge-col">
                  <span className="sim-col-label">Current Baseline</span>
                  <RiskGauge score={simResult.baseline_risk} size={150} />
                  <span className={`risk-band ${simResult.baseline_band}`}>
                    {simResult.baseline_band.toUpperCase()} RISK
                  </span>
                  <span className="sim-col-sub">{simResult.baseline_percentile}th percentile</span>
                </div>

                <div className="sim-gauge-divider">➔</div>

                <div className="sim-gauge-col highlight">
                  <span className="sim-col-label">Simulated Target</span>
                  <RiskGauge score={simResult.simulated_risk} size={150} />
                  <span className={`risk-band ${simResult.simulated_band}`}>
                    {simResult.simulated_band.toUpperCase()} RISK
                  </span>
                  <span className="sim-col-sub">{simResult.simulated_percentile}th percentile</span>
                </div>
              </div>

              {/* Delta Callout */}
              <div className={`sim-delta-card ${isRiskReduced ? "reduced" : isRiskIncreased ? "increased" : "neutral"}`}>
                <div className="delta-icon">
                  {isRiskReduced ? <ArrowDownRight size={28} /> : <ArrowUpRight size={28} />}
                </div>
                <div className="delta-text">
                  <h3>
                    {isRiskReduced
                      ? `${Math.abs(simResult.relative_change_pct)}% Lower Risk`
                      : isRiskIncreased
                      ? `${simResult.relative_change_pct}% Higher Risk`
                      : "No Risk Change"}
                  </h3>
                  <p>
                    {isRiskReduced
                      ? `Achieving these target metrics lowers absolute diabetes probability by ${(Math.abs(simResult.risk_delta) * 100).toFixed(1)} percentage points.`
                      : isRiskIncreased
                      ? `Worsening these biomarkers increases absolute diabetes probability by ${(simResult.risk_delta * 100).toFixed(1)} percentage points.`
                      : "Adjust the biomarker sliders above to see counterfactual impact."}
                  </p>
                </div>
              </div>

              {/* Biomarker Leverage Breakdown */}
              {simResult.key_factor_impacts && Object.keys(simResult.key_factor_impacts).length > 0 && (
                <div className="sim-leverage-wrap">
                  <h4>Highest Leverage Biomarker Interventions</h4>
                  <div className="leverage-list">
                    {Object.entries(simResult.key_factor_impacts).map(([factor, delta]) => (
                      <div key={factor} className="leverage-item">
                        <span className="leverage-name">
                          {factor === "glucose" ? "Fasting Blood Glucose" : factor === "bmi" ? "Body Mass Index (BMI)" : factor === "blood_pressure" ? "Blood Pressure" : factor}
                        </span>
                        <span className={`leverage-delta ${delta < 0 ? "good" : "bad"}`}>
                          {delta < 0 ? "▼ " : "▲ "}
                          {(Math.abs(delta) * 100).toFixed(1)}% risk
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="skeleton-gauge-wrap">
              <div className="skeleton skeleton-circle" />
              <div className="skeleton skeleton-line" style={{ width: 140 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
