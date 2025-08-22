import json
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.ensemble import GradientBoostingClassifier

# Default feature schema 
FEATURES: List[str] = [
    "Pregnancies",
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI",
    "DiabetesPedigreeFunction",
    "Age",
]

TARGET = "Outcome"

def build_pipeline() -> Pipeline:
    numeric_features = FEATURES
    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler(with_mean=True, with_std=True)),
    ])
    pre = ColumnTransformer(
        transformers=[("num", numeric_transformer, numeric_features)],
        remainder="drop"
    )
    clf = GradientBoostingClassifier(random_state=42)
    pipe = Pipeline([("pre", pre), ("clf", clf)])
    return pipe

def df_from_records(records: List[Dict]) -> pd.DataFrame:
    return pd.DataFrame.from_records(records)

def enforce_schema(df: pd.DataFrame) -> pd.DataFrame:
    
    for col in FEATURES:
        if col not in df.columns:
            df[col] = np.nan
    return df[FEATURES]

def split_X_y(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    X = df[FEATURES]
    y = df[TARGET] if TARGET in df.columns else None
    return X, y

def save_columns(path: str):
    with open(path, "w") as f:
        json.dump({"features": FEATURES, "target": TARGET}, f, indent=2)

def load_columns(path: str) -> Dict:
    with open(path, "r") as f:
        return json.load(f)
