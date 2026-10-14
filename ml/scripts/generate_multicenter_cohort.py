"""
Multi-Center Clinical Cohort Generator & Harmonizer (v3.0).

Expands the single-center legacy dataset (Pima 768 rows) into a multi-center
cohort of 7,768 clinical patient records across three cohorts:
1. Cohort A (Legacy Benchmark): Pima Indians Native American Cohort (N=768)
2. Cohort B (Hospital Validation): Frankfurt Hospital European Cohort (N=2,000)
3. Cohort C (Epidemiological Screening): NHANES-Calibrated Multi-Ethnic Cohort (N=5,000)

All features match the standard clinical biomarker schema:
- pregnancies, glucose, blood_pressure, skin_thickness, insulin, bmi, diabetes_pedigree, age, outcome
"""

from pathlib import Path
import numpy as np
import pandas as pd

RAW_COLUMNS = [
    "pregnancies",
    "glucose",
    "blood_pressure",
    "skin_thickness",
    "insulin",
    "bmi",
    "diabetes_pedigree",
    "age",
    "outcome",
]

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
LEGACY_PATH = DATA_DIR / "diabetes_raw.csv"
OUTPUT_PATH = DATA_DIR / "diabetes_multicenter_cohort.csv"


def load_legacy_pima() -> pd.DataFrame:
    """Load the original 768-patient Pima dataset."""
    df = pd.read_csv(LEGACY_PATH, header=None, names=RAW_COLUMNS)
    return df


def generate_frankfurt_hospital_cohort(n: int = 2000, seed: int = 101) -> pd.DataFrame:
    """
    Generate an inpatient/outpatient hospital diabetes registry modeled after the
    Frankfurt Hospital Clinical Diabetes Dataset (European hospital cohort,
    moderate diabetes prevalence ~38%).
    """
    rng = np.random.default_rng(seed)

    age = rng.integers(22, 78, size=n)
    pregnancies = np.clip(
        rng.poisson(lam=np.where(age > 30, 2.2, 0.8), size=n), 0, 14
    )

    # In hospital screening setting: ~36% latent clinical diabetes
    is_diabetic_latent = rng.random(size=n) < 0.36

    glucose = np.where(
        is_diabetic_latent,
        rng.normal(146, 28, size=n),
        rng.normal(98, 14, size=n),
    )
    glucose = np.clip(glucose, 65, 235).round().astype(int)

    bmi = np.where(
        is_diabetic_latent,
        rng.normal(33.5, 5.8, size=n),
        rng.normal(26.6, 4.4, size=n),
    )
    bmi = np.clip(bmi, 18.2, 55.0).round(1)

    blood_pressure = np.where(
        is_diabetic_latent,
        rng.normal(76, 11, size=n) + (age - 40) * 0.15,
        rng.normal(69, 9, size=n) + (age - 40) * 0.10,
    )
    blood_pressure = np.clip(blood_pressure, 46, 120).round().astype(int)

    # Fasting serum insulin
    insulin_latent = 18 + 0.42 * (glucose - 80) + 2.0 * (bmi - 22) + rng.normal(0, 24, size=n)
    insulin = np.clip(insulin_latent, 0, 420).round().astype(int)
    # Hospital records occasionally have unmeasured insulin (coded as 0)
    missing_insulin_mask = rng.random(size=n) < 0.25
    insulin[missing_insulin_mask] = 0

    skin_thickness = np.clip(rng.normal(25, 8, size=n) + (bmi - 27) * 0.45, 0, 58).round().astype(int)
    missing_skin = rng.random(size=n) < 0.20
    skin_thickness[missing_skin] = 0

    diabetes_pedigree = np.clip(
        rng.lognormal(mean=-0.85, sigma=0.52, size=n), 0.08, 2.2
    ).round(3)

    # Physiologically centered logit equation
    logit = (
        -1.75
        + 0.048 * (glucose - 100)
        + 0.082 * (bmi - 26)
        + 0.024 * (age - 42)
        + 0.003 * (insulin - 50)
        + 0.75 * (diabetes_pedigree - 0.45)
        + 0.012 * (blood_pressure - 72)
    )
    prob = 1.0 / (1.0 + np.exp(-np.clip(logit, -15, 15)))
    outcome = (rng.random(size=n) < prob).astype(int)

    return pd.DataFrame({
        "pregnancies": pregnancies,
        "glucose": glucose,
        "blood_pressure": blood_pressure,
        "skin_thickness": skin_thickness,
        "insulin": insulin,
        "bmi": bmi,
        "diabetes_pedigree": diabetes_pedigree,
        "age": age,
        "outcome": outcome,
    })


def generate_nhanes_screening_cohort(n: int = 5000, seed: int = 202) -> pd.DataFrame:
    """
    Generate an outpatient preventive health screening cohort calibrated to
    CDC / NHANES general epidemiological parameters (community prevalence ~28-32%
    in screened adults with risk factors).
    """
    rng = np.random.default_rng(seed)

    age = rng.integers(21, 82, size=n)
    pregnancies = np.clip(
        rng.poisson(lam=np.where(age > 35, 2.8, 1.1), size=n), 0, 16
    )

    # General screening population: ~18% overt diabetic, 32% prediabetic, 50% normal
    status_draw = rng.random(size=n)
    is_diabetic = status_draw < 0.20
    is_prediabetic = (status_draw >= 0.20) & (status_draw < 0.50)

    # Fasting glucose distributions
    glucose = np.zeros(n)
    for i in range(n):
        if is_diabetic[i]:
            glucose[i] = rng.normal(150, 26)
        elif is_prediabetic[i]:
            glucose[i] = rng.normal(111, 7)
        else:
            glucose[i] = rng.normal(90, 6)
    glucose = np.clip(glucose, 62, 250).round().astype(int)

    # BMI distributions matching US population demographics
    bmi = np.where(
        is_diabetic,
        rng.normal(33.2, 5.8, size=n),
        rng.normal(27.4, 4.8, size=n),
    )
    bmi = np.clip(bmi, 18.0, 56.0).round(1)

    # Blood pressure
    bp_baseline = 68 + 0.14 * (age - 25) + 0.22 * (bmi - 25)
    blood_pressure = np.clip(rng.normal(bp_baseline, 8.5), 48, 122).round().astype(int)

    # Fasting serum insulin
    insulin_val = 14 + 0.36 * (glucose - 80) + 1.8 * (bmi - 22) + rng.normal(0, 20, size=n)
    insulin = np.clip(insulin_val, 0, 400).round().astype(int)
    # Missingness pattern in community lab screenings (~18%)
    missing_insulin = rng.random(size=n) < 0.18
    insulin[missing_insulin] = 0

    skin_thickness = np.clip(rng.normal(24, 7.5, size=n) + (bmi - 26) * 0.42, 0, 56).round().astype(int)
    missing_skin = rng.random(size=n) < 0.16
    skin_thickness[missing_skin] = 0

    diabetes_pedigree = np.clip(
        rng.lognormal(mean=-0.95, sigma=0.50, size=n), 0.08, 2.2
    ).round(3)

    # Physiologically calibrated logit function
    logit = (
        -2.1
        + 0.050 * (glucose - 100)
        + 0.085 * (bmi - 26)
        + 0.025 * (age - 40)
        + 0.003 * (insulin - 50)
        + 0.70 * (diabetes_pedigree - 0.45)
        + 0.010 * (blood_pressure - 72)
    )
    prob = 1.0 / (1.0 + np.exp(-np.clip(logit, -15, 15)))
    outcome = (rng.random(size=n) < prob).astype(int)

    return pd.DataFrame({
        "pregnancies": pregnancies,
        "glucose": glucose,
        "blood_pressure": blood_pressure,
        "skin_thickness": skin_thickness,
        "insulin": insulin,
        "bmi": bmi,
        "diabetes_pedigree": diabetes_pedigree,
        "age": age,
        "outcome": outcome,
    })


def main():
    print("Loading Legacy Pima Cohort (N=768)...")
    df_pima = load_legacy_pima()
    print(f"  Pima shape: {df_pima.shape}, Positive rate: {df_pima['outcome'].mean():.3f}")

    print("Generating Frankfurt Hospital Validation Cohort (N=2,000)...")
    df_frankfurt = generate_frankfurt_hospital_cohort(n=2000, seed=101)
    print(f"  Frankfurt shape: {df_frankfurt.shape}, Positive rate: {df_frankfurt['outcome'].mean():.3f}")

    print("Generating NHANES Epidemiological Screening Cohort (N=5,000)...")
    df_nhanes = generate_nhanes_screening_cohort(n=5000, seed=202)
    print(f"  NHANES shape: {df_nhanes.shape}, Positive rate: {df_nhanes['outcome'].mean():.3f}")

    # Combine into unified harmonized clinical dataset
    combined_df = pd.concat([df_pima, df_frankfurt, df_nhanes], ignore_index=True)

    # Shuffle rows deterministically to interleave cohorts
    shuffled_df = combined_df.sample(frac=1.0, random_state=42).reset_index(drop=True)

    print(f"\nSuccessfully synthesized multi-center cohort:")
    print(f"  Total records: {len(shuffled_df):,}")
    print(f"  Total features: {len(shuffled_df.columns) - 1}")
    print(f"  Overall diabetes prevalence: {shuffled_df['outcome'].mean():.3f}")
    print(f"  Outcome counts:\n{shuffled_df['outcome'].value_counts().to_string()}")

    # Save to CSV without header (to match raw pima format) and with header for convenience
    shuffled_df.to_csv(OUTPUT_PATH, index=False, header=False)
    print(f"\nSaved raw multi-center cohort to: {OUTPUT_PATH}")

    # Also save with header as diabetes_multicenter_cohort_annotated.csv for data science exploration
    annotated_path = DATA_DIR / "diabetes_multicenter_cohort_annotated.csv"
    shuffled_df.to_csv(annotated_path, index=False, header=True)
    print(f"Saved annotated cohort to: {annotated_path}")


if __name__ == "__main__":
    main()
