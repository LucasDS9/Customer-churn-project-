from fastapi import FastAPI
import joblib
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
ARTIFACTS_DIR = BASE_DIR / "artifacts"

MODEL_PATH = ARTIFACTS_DIR / "model_classifier.pkl"
THRESHOLD_PATH = ARTIFACTS_DIR / "threshold.pkl"

model = joblib.load(MODEL_PATH)

try:
    threshold = joblib.load(THRESHOLD_PATH)
except FileNotFoundError:
    threshold = 0.35


app = FastAPI(title="Customer Churn API")

@app.get("/")
def home():
    return {"message": "Customer Churn API is running"}

@app.post("/predict")
def predict(data: dict):
    df = pd.DataFrame([data])
    pred_proba = model.predict_proba(df)[:, 1]

    churn_probability = float(pred_proba[0])
    churn_prediction = int(churn_probability > threshold)

    return {
        "churn_probability": churn_probability,
        "churn_prediction": churn_prediction
    }




