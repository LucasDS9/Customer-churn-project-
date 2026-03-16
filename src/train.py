from pathlib import Path

import joblib
import mlflow
import mlflow.sklearn
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split

from pipeline import build_classifier_pipeline 


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "customer_dataset.csv"
ARTIFACTS_DIR = BASE_DIR / "artifacts"
ARTIFACTS_DIR.mkdir(exist_ok=True)

MLFLOW_TRACKING_URI = "http://127.0.0.1:5000"
MLFLOW_EXPERIMENT_NAME = "customer_churn_experiment"

MODELS = {
    "logistic_regression": LogisticRegression(max_iter=10, random_state=0),
    "random_forest": RandomForestClassifier(n_estimators=10, random_state=0),
    "gradient_boosting": GradientBoostingClassifier(n_estimators=10, random_state=0),
}


def prepare_data():
    df = pd.read_csv(DATA_PATH)
    df.drop(columns=["RowNumber", "CustomerId", "Surname", "Geography"], inplace=True, errors="ignore")

    X, y = df.drop(columns=["Exited"]), df["Exited"]
    cat_cols = X.select_dtypes(include="object").columns.tolist()

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=0, stratify=y)
    return X_train, X_test, y_train, y_test, cat_cols


def train():
    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    mlflow.set_experiment(MLFLOW_EXPERIMENT_NAME)
    mlflow.sklearn.autolog(log_models=False)

    X_train, X_test, y_train, y_test, cat_cols = prepare_data()
    joblib.dump((X_test, y_test), ARTIFACTS_DIR / "test.pkl")

    for run_name, model in MODELS.items():
        with mlflow.start_run(run_name=run_name):
            pipeline = build_classifier_pipeline(cat_cols, model)  
            pipeline.fit(X_train, y_train)

            auc = roc_auc_score(y_test, pipeline.predict_proba(X_test)[:, 1])
            mlflow.log_metric("test_roc_auc", auc)
            mlflow.sklearn.log_model(pipeline, artifact_path="model")
            print(f"✅ {run_name} — AUC: {auc:.4f}")


if __name__ == "__main__":
    train()