import os
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Literal, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from groq import Groq

if os.environ.get("RENDER"):
    load_dotenv("/etc/secrets/.env")
else:
    load_dotenv()

BASE_DIR     = Path(__file__).resolve().parent
MODEL_PATH   = BASE_DIR / "artifacts" / "model.pkl"
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

THRESHOLD  = 0.35
GROQ_MODEL = "llama-3.3-70b-versatile"

if not MODEL_PATH.exists():
    raise RuntimeError(f"Model file not found at {MODEL_PATH}")

_model = joblib.load(MODEL_PATH)


def get_model():
    return _model


def _get_groq_client():
    return Groq(api_key=os.environ.get("GROQ_API_KEY"))


class CustomerInput(BaseModel):
    CustomerId: Optional[int] = Field(default=None)
    CreditScore: int = Field(..., ge=300, le=850)
    Gender: Literal["Male", "Female"]
    Age: int = Field(..., ge=0, le=100)
    Tenure: int = Field(..., ge=0, le=10)
    IsActiveMember: Literal[0, 1]
    EstimatedSalary: float = Field(..., ge=0)
    Complain: Literal[0, 1]
    SatisfactionScore: int = Field(..., ge=1, le=5, alias="Satisfaction Score")

    model_config = {"populate_by_name": True}


class PredictionResponse(BaseModel):
    customer_id: Optional[int]
    churn_probability: float
    risk_level: Literal["Low Risk", "Medium Risk", "High Risk"]
    prediction: int
    explanation: str


def classify_risk(prob: float):
    if prob < 0.30:
        return "Low Risk"
    elif prob < 0.70:
        return "Medium Risk"
    return "High Risk"


def build_feature_row(data: CustomerInput):
    return pd.DataFrame([{
        "CreditScore": data.CreditScore,
        "Gender": data.Gender,
        "Age": data.Age,
        "Tenure": data.Tenure,
        "IsActiveMember": data.IsActiveMember,
        "EstimatedSalary": data.EstimatedSalary,
        "Complain": data.Complain,
        "Satisfaction Score": data.SatisfactionScore,
    }])


def _run_prediction(customer, threshold):
    model = get_model()
    X     = build_feature_row(customer)
    prob  = float(model.predict_proba(X)[0][1])
    pred  = int(prob >= threshold)
    risk  = classify_risk(prob)
    return prob, pred, risk


def _run_explanation(customer, prob, pred, risk, threshold):
    result_label = "tende a sair" if pred == 1 else "tende a ficar"

    prompt = f"""
Você é um especialista em retenção de clientes.

Resultado do modelo:
- Probabilidade de churn: {prob:.1%}
- Risco: {risk}
- Cliente {result_label}

Dados:
- Idade: {customer.Age}
- Tempo de banco: {customer.Tenure}
- Ativo: {"Sim" if customer.IsActiveMember else "Não"}
- Salário: {customer.EstimatedSalary}
- Reclamação: {"Sim" if customer.Complain else "Não"}
- Satisfação: {customer.SatisfactionScore}/5

Explique de forma simples e sugira ações se necessário.
"""

    response = _get_groq_client().chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": "Responda em português claro."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.4,
    )

    return response.choices[0].message.content.strip()


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/app")


@app.get("/metrics", summary="Model metrics")
def metrics():
    if not METRICS_PATH.exists():
        raise HTTPException(status_code=404, detail="metrics.json not found")
    with open(METRICS_PATH) as f:
        return json.load(f)


@app.post("/predict", response_model=PredictionResponse)
def predict(customer: CustomerInput, threshold: float = THRESHOLD):
    try:
        prob, pred, risk = _run_prediction(customer, threshold)
        explanation      = _run_explanation(customer, prob, pred, risk, threshold)

        return PredictionResponse(
            customer_id=customer.CustomerId,
            churn_probability=round(prob, 4),
            risk_level=risk,
            prediction=pred,
            explanation=explanation,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


_frontend_dir = BASE_DIR / "frontend"
if _frontend_dir.is_dir():
    app.mount("/app", StaticFiles(directory=str(_frontend_dir), html=True), name="frontend")