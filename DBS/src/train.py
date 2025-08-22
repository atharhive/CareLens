import argparse, os, json, joblib, numpy as np, pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import roc_auc_score, classification_report, confusion_matrix
try:
    from .preprocess import build_pipeline, split_X_y, enforce_schema, save_columns
except ImportError:
    # Allow running as a script: uv run src/train.py
    import sys as _sys
    _sys.path.append(os.path.dirname(os.path.dirname(__file__)))
    from src.preprocess import build_pipeline, split_X_y, enforce_schema, save_columns

def _resolve_data_path(input_path: str) -> str:
    p = Path(input_path)
    here = Path(__file__).resolve().parent
    repo_root = here.parent
    cwd = Path.cwd()
    candidates = []
    # As provided (absolute or relative to CWD)
    candidates.append(p if p.is_absolute() else cwd / p)
    # Relative to src/ and project root
    candidates.append(here / p)
    candidates.append(repo_root / p)
    # If path starts with 'DBS/', try stripped variants
    if len(p.parts) > 0 and p.parts[0].lower() == "dbs":
        stripped = Path(*p.parts[1:])
        candidates.append(cwd / stripped)
        candidates.append(here / stripped)
        candidates.append(repo_root / stripped)
    for c in candidates:
        if c.exists():
            return str(c)
    tried = ", ".join(str(c) for c in candidates)
    raise FileNotFoundError(f"Could not find data file '{input_path}'. Tried: {tried}")

def train(data_path: str, outdir: str, test_size: float=0.2, seed: int=42):
    os.makedirs(outdir, exist_ok=True)
    resolved_data_path = _resolve_data_path(data_path)
    df = pd.read_csv(resolved_data_path)
    df = enforce_schema(df)
    X = df
    y = pd.read_csv(resolved_data_path)["Outcome"].astype(int)

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=test_size, random_state=seed, stratify=y)

    # Base pipeline
    base_pipe = build_pipeline()

    # Fit base
    base_pipe.fit(X_train, y_train)

    # Calibrate probabilities on validation split for better probability estimates
    calibrated = CalibratedClassifierCV(estimator=base_pipe, method="isotonic", cv="prefit")
    calibrated.fit(X_val, y_val)

    # Evaluate
    val_proba = calibrated.predict_proba(X_val)[:,1]
    val_pred = (val_proba >= 0.5).astype(int)

    auc = roc_auc_score(y_val, val_proba)
    cm = confusion_matrix(y_val, val_pred).tolist()
    rep = classification_report(y_val, val_pred, output_dict=True)

    metrics = {
        "roc_auc": float(auc),
        "confusion_matrix": cm,
        "report": rep
    }
    with open(os.path.join(outdir, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    # Save artifacts
    joblib.dump(calibrated, os.path.join(outdir, "model.joblib"))
    save_columns(os.path.join(outdir, "columns.json"))
    print("Saved model to", os.path.join(outdir, "model.joblib"))
    print("Validation ROC AUC:", auc)

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True, help="Path to CSV with Outcome label")
    ap.add_argument("--outdir", default="models")
    ap.add_argument("--test_size", type=float, default=0.2)
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()
    train(args.data, args.outdir, args.test_size, args.seed)
