import joblib
from pathlib import Path
from typing import Literal, Optional
import json
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "artifacts" / "model.pkl"
METRICS_PATH = BASE_DIR / "artifacts" / "metrics.json"

app = FastAPI(
    title="Churn Prediction API",
    description="Predicts bank customer churn probability.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

THRESHOLD = 0.35

if not MODEL_PATH.exists():
    raise RuntimeError(f"Model file not found at {MODEL_PATH}")

_model = joblib.load(MODEL_PATH)


def get_model():
    return _model


class CustomerInput(BaseModel):
    CustomerId: Optional[int] = Field(default=None)
    CreditScore: int = Field(..., ge=300, le=850)
    Gender: Literal["Male", "Female"]
    Age: int = Field(..., ge=0, le=100)
    Tenure: int = Field(..., ge=0, le=10)
    Balance: float = Field(..., ge=0)
    NumOfProducts: int = Field(..., ge=1, le=4)
    HasCrCard: Literal[0, 1]
    IsActiveMember: Literal[0, 1]
    EstimatedSalary: float = Field(..., ge=0)
    Complain: Literal[0, 1]
    SatisfactionScore: int = Field(..., ge=1, le=5, alias="Satisfaction Score")
    PointsEarned: int = Field(..., ge=0, alias="Points Earned")
    CardType: Literal["DIAMOND", "GOLD", "SILVER", "PLATINUM"] = Field(..., alias="Card Type")

    model_config = {"populate_by_name": True}


class PredictionResponse(BaseModel):
    customer_id: Optional[int]
    churn_probability: float
    risk_level: Literal["Low Risk", "Medium Risk", "High Risk"]
    prediction: int


def classify_risk(prob: float) -> Literal["Low Risk", "Medium Risk", "High Risk"]:
    if prob < 0.30:
        return "Low Risk"
    elif prob < 0.70:
        return "Medium Risk"
    else:
        return "High Risk"


def build_feature_row(data: CustomerInput) -> pd.DataFrame:
    return pd.DataFrame([{
        "CreditScore": data.CreditScore,
        "Gender": data.Gender,
        "Age": data.Age,
        "Tenure": data.Tenure,
        "Balance": data.Balance,
        "NumOfProducts": data.NumOfProducts,
        "HasCrCard": data.HasCrCard,
        "IsActiveMember": data.IsActiveMember,
        "EstimatedSalary": data.EstimatedSalary,
        "Complain": data.Complain,
        "Satisfaction Score": data.SatisfactionScore,
        "Points Earned": data.PointsEarned,
        "Card Type": data.CardType,
    }])


@app.get("/", summary="Root")
def root():
    return {"message": "Churn Prediction API is running"}


@app.get("/health", summary="Health check")
def health():
    return {"status": "ok", "model_loaded": _model is not None}


@app.post("/predict", response_model=PredictionResponse, summary="Predict churn")
def predict(customer: CustomerInput):
    try:
        model = get_model()
        X = build_feature_row(customer)
        prob = float(model.predict_proba(X)[0][1])
        pred = int(prob >= THRESHOLD)
        risk = classify_risk(prob)

        return PredictionResponse(
            customer_id=customer.CustomerId,
            churn_probability=round(prob, 4),
            risk_level=risk,
            prediction=pred,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.get("/metrics", summary="Model metrics")
def metrics():
    if not METRICS_PATH.exists():
        raise HTTPException(status_code=404, detail="metrics.json not found")
    with open(METRICS_PATH) as f:
        return json.load(f)


_frontend_dir = BASE_DIR / "frontend"
if _frontend_dir.is_dir():
    app.mount("/app", StaticFiles(directory=str(_frontend_dir), html=True), name="frontend")