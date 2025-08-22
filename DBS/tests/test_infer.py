import json, os
from src.infer import load, predict_one

def test_predict_sanity():
    model, cols = load("models/model.joblib", "models/columns.json")
    payload = {
        "Glucose": 145,
        "BloodPressure": 82,
        "BMI": 29.1,
        "Insulin": 130,
        "Age": 40,
        "Pregnancies": 2,
        "SkinThickness": 20,
        "DiabetesPedigreeFunction": 0.45
    }
    out = predict_one(model, cols, payload)
    assert "probability" in out and 0.0 <= out["probability"] <= 1.0
