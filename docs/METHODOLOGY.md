# Methodology

## Data

The Pima Indians Diabetes dataset: 768 patient records, 8 clinical features
(pregnancies, glucose, blood pressure, skin thickness, insulin, BMI,
diabetes pedigree function, age), binary outcome (diabetes onset within 5
years). It's a small, well-studied dataset — the choice here is deliberate:
it's small enough to make cross-validation variance and calibration
genuinely matter (see Experiments), which is exactly the kind of nuance a
larger, cleaner dataset would hide.

## Handling missing values

The raw data encodes missing values as `0` for fields where zero is not
physiologically possible (glucose, blood pressure, skin thickness, insulin,
BMI). Treating these as literal zeros — a mistake many public notebooks on
this dataset make — silently teaches the model that "0 glucose" is a real,
survivable data point. Instead:

1. Zeros in those five columns are converted to `NaN` at load time.
2. A `SimpleImputer(strategy="median")` is fit **only on the training
   split** and applied to both splits, preventing test-set information from
   leaking into imputation statistics.

## Feature engineering

Beyond the raw clinical values, three binned categorical features are
derived (BMI category, glucose category, age bucket) plus one interaction
term (glucose × BMI, a rough metabolic-load proxy). These are one-hot
encoded. The binned features matter more for the linear model than the
tree models — trees can already learn non-linear splits on the raw values,
while logistic regression benefits from explicit thresholds — which shows
up directly in the SHAP output (see Experiments).

## Handling class imbalance

The outcome is imbalanced (~35% positive in the training split). Two
mechanisms are used depending on the model:

- Logistic regression and random forest: `class_weight="balanced"`.
- XGBoost: `scale_pos_weight` set to the negative/positive class ratio.

Given the imbalance, **AUPRC (average precision) is treated as the primary
model-selection metric**, not accuracy or even AUROC — AUROC can look
deceptively good on imbalanced data because it's dominated by the (easy)
majority class.

## Validation strategy

- 80/20 stratified train/test split, held out entirely from model
  selection.
- 5-fold stratified cross-validation on the training split for every
  candidate model, reporting mean and standard deviation of AUROC and
  AUPRC — the standard deviation matters as much as the mean on a dataset
  this size (see Experiments for why).
- A final, single evaluation on the untouched test set, used only to
  report the numbers in this document — never to pick between models.

## Calibration

Because a "72% risk" score is only useful if it actually means ~72% of
similar patients have the condition, calibration is evaluated explicitly
via reliability curves (`ml/reports/calibration_curves.png`), and an
isotonic-calibrated version of the best raw model is trained and compared
against the uncalibrated candidates on Brier score.

## Explainability

SHAP is used for two levels of explanation:

- **Global**: a summary (beeswarm) plot over the test set, used to sanity
  check that the model's global feature importance matches clinical
  intuition (glucose and BMI dominate — see `ml/reports/shap_summary.png`).
- **Local**: at inference time, the backend computes a per-request SHAP
  explanation and returns it alongside the prediction, so every risk score
  shown in the dashboard comes with "why."
