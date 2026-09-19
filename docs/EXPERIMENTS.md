# Experiments & model comparison

All numbers below come from an actual run of `ml/train.py` against the
768-row Pima dataset (results are logged to MLflow; raw CSV in
`ml/reports/model_comparison.csv`).

| Model | Test AUROC | Test AUPRC | Test F1 | Test Brier | CV AUPRC (mean ± std) |
|---|---|---|---|---|---|
| Logistic regression | 0.840 | **0.718** | 0.733 | 0.164 | 0.743 ± 0.066 |
| Random forest | 0.825 | 0.702 | 0.678 | 0.163 | 0.731 ± 0.046 |
| XGBoost | 0.826 | 0.710 | 0.673 | 0.171 | 0.666 ± 0.065 |
| Logistic regression (isotonic-calibrated) | 0.841 | 0.717 | 0.594 | **0.161** | — |

**Winner: plain logistic regression**, selected on test AUPRC (0.718), the
primary model-selection metric given class imbalance.

## Reading these results honestly

This is worth sitting with rather than skating past: **the simplest model
won.** That's a real result, not a failure of the pipeline, and it's a
better interview story than a fabricated XGBoost win would be. Three things
explain it:

1. **Dataset size.** 768 rows is small for gradient-boosted trees, which
   have more capacity to overfit than a regularized linear model. The CV
   standard deviation makes this visible directly: XGBoost's CV AUPRC has
   the widest spread (± 0.065) and the lowest mean (0.666) of the three
   raw models — a sign it's less stable across folds, not just weaker on
   average.
2. **Feature engineering did some of the trees' job for them.** The binned
   BMI/glucose/age features and the interaction term hand the linear model
   explicit non-linear structure it can't discover on its own — closing
   most of the gap that would otherwise favor tree-based models.
3. **The underlying relationships are close to linear.** Glucose and BMI
   are both strong, roughly monotonic risk factors for diabetes — exactly
   the setting where logistic regression is a strong baseline, not just a
   sanity check.

## What calibration changed

Isotonic calibration slightly improved Brier score (0.164 → 0.161) but
*reduced* F1 (0.733 → 0.594), because isotonic regression on a training set
this small overfits the calibration mapping itself and shifts the decision
threshold. This is the kind of trade-off that's easy to miss if you only
look at one metric — it's why the comparison table reports four metrics
side by side rather than picking a single "score."

## Takeaways for a larger dataset

With materially more data, I'd expect this ranking to flip — this is a case
where the standard "try gradient boosting first" heuristic is dataset-size-
dependent, and it's worth being able to say why rather than assuming trees
always win.
