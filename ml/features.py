"""
Feature engineering for the diabetes risk model.

Design notes (worth remembering for interviews):
- The raw Pima dataset encodes missing values as 0 for physiologically
  impossible fields (glucose, blood pressure, skin thickness, insulin, BMI).
  We treat these as missing (NaN) rather than real zeros, then impute.
- Imputation uses the median WITHIN each outcome-independent split (i.e.
  fit on train, applied to test) to avoid leakage.
- We add a small number of derived features that a clinician would
  recognize (BMI category, glucose category, age bucket) because tree
  models benefit from these binned features less than linear models do,
  which itself becomes a talking point in the model comparison.
"""

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

# Columns where 0 is not physiologically plausible and really means "missing"
ZERO_AS_MISSING = ["glucose", "blood_pressure", "skin_thickness", "insulin", "bmi"]


def load_raw(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, header=None, names=RAW_COLUMNS)
    return df


def mark_missing(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for col in ZERO_AS_MISSING:
        df[col] = df[col].replace(0, np.nan)
    return df


def add_derived_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    df["bmi_category"] = pd.cut(
        df["bmi"],
        bins=[0, 18.5, 25, 30, 100],
        labels=["underweight", "normal", "overweight", "obese"],
    )
    df["glucose_category"] = pd.cut(
        df["glucose"],
        bins=[0, 100, 125, 300],
        labels=["normal", "prediabetic", "diabetic_range"],
    )
    df["age_bucket"] = pd.cut(
        df["age"],
        bins=[0, 30, 45, 60, 100],
        labels=["young_adult", "adult", "middle_age", "senior"],
    )

    # A simple interaction: metabolic load proxy
    df["glucose_bmi_interaction"] = df["glucose"] * df["bmi"] / 100.0

    return df


def one_hot(df: pd.DataFrame) -> pd.DataFrame:
    cat_cols = ["bmi_category", "glucose_category", "age_bucket"]
    return pd.get_dummies(df, columns=cat_cols, drop_first=True)


def build_feature_frame(raw_path: str) -> pd.DataFrame:
    df = load_raw(raw_path)
    df = mark_missing(df)
    df = add_derived_features(df)
    df = one_hot(df)
    return df
