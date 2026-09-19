const LABELS = {
  glucose: "Glucose",
  bmi: "BMI",
  age: "Age",
  pregnancies: "Pregnancies",
  blood_pressure: "Blood pressure",
  skin_thickness: "Skin thickness",
  insulin: "Insulin",
  diabetes_pedigree: "Family history",
  glucose_bmi_interaction: "Glucose × BMI",
  age_bucket_adult: "Age group: adult",
  age_bucket_middle_age: "Age group: middle age",
  age_bucket_senior: "Age group: senior",
  bmi_category_normal: "BMI category: normal",
  bmi_category_overweight: "BMI category: overweight",
  bmi_category_obese: "BMI category: obese",
  glucose_category_prediabetic: "Glucose: prediabetic range",
  glucose_category_diabetic_range: "Glucose: diabetic range",
};

function labelFor(feature) {
  return LABELS[feature] || feature;
}

export default function ShapExplanation({ result, loading }) {
  if (loading) {
    return (
      <div className="skeleton-shap-wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="skeleton skeleton-row" key={i} />
        ))}
      </div>
    );
  }

  if (!result) {
    return (
      <div className="empty-state">
        Feature contributions for this prediction will appear here.
      </div>
    );
  }

  const contribs = result.shap_contributions.slice(0, 8);
  const maxAbs = Math.max(...contribs.map((c) => Math.abs(c.value)), 0.0001);

  return (
    <div>
      {contribs.map((c, i) => {
        // Track represents -maxAbs .. +maxAbs, centered at 50%. Each bar
        // occupies at most half the track width on its side of center.
        const halfWidthPct = (Math.abs(c.value) / maxAbs) * 50;
        const positive = c.value >= 0;
        return (
          <div className="shap-row" key={c.feature} style={{ animationDelay: `${i * 45}ms` }}>
            <span className="shap-label">{labelFor(c.feature)}</span>
            <div className="shap-bar-track">
              <div
                className="shap-bar-fill grow-in"
                style={{
                  width: `${halfWidthPct}%`,
                  left: positive ? "50%" : `${50 - halfWidthPct}%`,
                  background: positive ? "var(--risk-high)" : "var(--risk-low)",
                }}
              />
            </div>
            <span className="shap-value">
              {positive ? "+" : ""}
              {c.value.toFixed(2)}
            </span>
          </div>
        );
      })}
      <p className="footnote">
        Red bars push the risk estimate higher, green bars pull it lower.
        Values are SHAP contributions (in log-odds space) relative to the
        model's average prediction across the training population.
      </p>
    </div>
  );
}
