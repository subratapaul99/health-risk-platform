# Model card — diabetes risk model v1

## Intended use

Educational / portfolio demonstration of a risk-prediction pipeline. Given
routine clinical measurements, estimates the probability of diabetes onset
indicators, and explains that estimate with per-feature SHAP attributions.

**Not intended for clinical use.** This model is not validated against a
real patient population, not reviewed by any clinical body, and trained on
a single, small, decades-old public dataset. It should not inform an actual
medical decision.

## Training data

Pima Indians Diabetes dataset (National Institute of Diabetes and Digestive
and Kidney Diseases), 768 records. All patients in the source dataset are
female, of Pima Indian heritage, and at least 21 years old — a narrow and
non-representative population. A model trained on this data will not
generalize to men, to other ethnic groups, or to younger patients, and
**should not be assumed to be accurate outside this population.**

## Performance

See `docs/EXPERIMENTS.md` for the full comparison. Headline numbers for the
deployed model (logistic regression): test AUROC 0.840, test AUPRC 0.718,
test F1 0.733, on an 80/20 held-out split of the 768-row dataset.

No subgroup performance breakdown is available for this dataset (the
population is not diverse enough on the recorded attributes to meaningfully
subgroup), which is itself a limitation worth stating rather than omitting.

## Known limitations

- **Small dataset.** 768 rows produces meaningfully wide confidence
  intervals on every metric — see the cross-validation standard deviations
  in `docs/EXPERIMENTS.md`.
- **Narrow population**, as above — a significant fairness and
  generalization concern for anything beyond a demo.
- **Missing-value imputation** uses simple median imputation, which
  understates uncertainty for patients with several missing measurements.
- **No temporal validation.** The dataset has no timestamps, so the model
  has never been tested on data collected after its training period, which
  a real deployment would require (checking for data/concept drift).

## Explainability caveats

SHAP values explain what the *model* is doing, not necessarily true causal
relationships in biology — e.g. "pregnancies" carries a nontrivial SHAP
weight not because pregnancy causes diabetes, but because it's correlated
with age and other risk factors within this specific dataset.
