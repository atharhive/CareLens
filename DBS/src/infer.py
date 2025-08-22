import argparse, json, joblib, pandas as pd, numpy as np
from typing import Dict
try:
    from .preprocess import load_columns
except ImportError:
    # Allow running as a script: uv run src/infer.py
    import os, sys
    sys.path.append(os.path.dirname(os.path.dirname(__file__)))
    from src.preprocess import load_columns

def load(model_path: str, columns_path: str):
    model = joblib.load(model_path)
    cols = load_columns(columns_path)
    return model, cols

def prepare_df(payload: Dict, expected_features):
    df = pd.DataFrame([payload])
    for c in expected_features:
        if c not in df.columns:
            df[c] = np.nan
    df = df[expected_features]
    return df

def predict_one(model, cols, payload: Dict):
    df = prepare_df(payload, cols["features"])
    proba = float(model.predict_proba(df)[0,1])
    pred = int(proba >= 0.5)
    flags = []
    g = payload.get("Glucose", None)
    if g is not None and g >= 126:
        flags.append(f"High fasting glucose: {g}")
    bmi = payload.get("BMI", None)
    if bmi is not None and bmi >= 30:
        flags.append(f"Obesity (BMI): {bmi}")
    age = payload.get("Age", None)
    if age is not None and age >= 45:
        flags.append(f"Age: {age} (risk increases with age)")
    return {"prediction": pred, "probability": proba, "risk_flags": flags}

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--columns", required=True)
    ap.add_argument("--json", required=True, help="JSON string of feature dict")
    args = ap.parse_args()
    payload = json.loads(args.json)
    model, cols = load(args.model, args.columns)
    out = predict_one(model, cols, payload)
    print(json.dumps(out, indent=2))
