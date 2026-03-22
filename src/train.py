from pathlib import Path

import joblib
import mlflow
import mlflow.sklearn
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    roc_auc_score,
    f1_score,
    accuracy_score,
    recall_score,
    roc_curve,
    precision_recall_curve
)
from sklearn.model_selection import train_test_split

from pipeline import build_classifier_pipeline


BASE_DIR      = Path(__file__).resolve().parent.parent
DATA_PATH     = BASE_DIR / "data" / "customer_dataset.csv"
ARTIFACTS_DIR = BASE_DIR / "artifacts"
ARTIFACTS_DIR.mkdir(exist_ok=True)

MLFLOW_TRACKING_URI    = "http://127.0.0.1:5000"
MLFLOW_EXPERIMENT_NAME = "customer_churn_experiment"

THRESHOLD = 0.35

MODELS = {
    "logistic_regression": LogisticRegression(max_iter=1000, random_state=0),
    "random_forest":       RandomForestClassifier(n_estimators=100, random_state=0),
    "gradient_boosting":   GradientBoostingClassifier(n_estimators=100, random_state=0),
}

COLS_DROP = [
    "RowNumber", "CustomerId", "Surname", "Geography",
    "Balance", "NumOfProducts", "HasCrCard", "Card Type", "Point Earned",
]


def prepare_data():
    df = pd.read_csv(DATA_PATH)
    df.drop(columns=COLS_DROP, inplace=True, errors="ignore")

    X, y     = df.drop(columns=["Exited"]), df["Exited"]
    cat_cols = X.select_dtypes(include="object").columns.tolist()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.3,
        random_state=0,
        stratify=y
    )

    return X_train, X_test, y_train, y_test, cat_cols


def plot_roc_curve(y_test, pred_proba, run_name):
    fpr, tpr, _ = roc_curve(y_test, pred_proba)

    plt.figure()
    plt.plot(fpr, tpr)
    plt.plot([0, 1], [0, 1], linestyle="--")
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title(f"ROC Curve - {run_name}")

    path = ARTIFACTS_DIR / f"roc_{run_name}.png"
    plt.savefig(path)
    plt.close()

    return path


def plot_pr_curve(y_test, pred_proba, run_name):
    precision, recall, _ = precision_recall_curve(y_test, pred_proba)

    plt.figure()
    plt.plot(recall, precision)
    plt.xlabel("Recall")
    plt.ylabel("Precision")
    plt.title(f"Precision-Recall Curve - {run_name}")

    path = ARTIFACTS_DIR / f"pr_{run_name}.png"
    plt.savefig(path)
    plt.close()

    return path


def plot_threshold_analysis(y_test, pred_proba, run_name):
    thresholds = np.linspace(0, 1, 100)

    f1_scores = []
    recall_1_scores = []

    for t in thresholds:
        y_pred = (pred_proba >= t).astype(int)
        f1_scores.append(f1_score(y_test, y_pred))
        recall_1_scores.append(recall_score(y_test, y_pred, pos_label=1))

    best_idx = np.argmax(f1_scores)
    best_threshold = thresholds[best_idx]

    plt.figure()
    plt.plot(thresholds, f1_scores, label="F1 Score")
    plt.plot(thresholds, recall_1_scores, label="Recall (Churn=1)")
    plt.axvline(best_threshold, linestyle="--")

    plt.xlabel("Threshold")
    plt.ylabel("Score")
    plt.title(f"Threshold Analysis - {run_name}")
    plt.legend()

    path = ARTIFACTS_DIR / f"threshold_{run_name}.png"
    plt.savefig(path)
    plt.close()

    return path, best_threshold


def train():
    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    mlflow.set_experiment(MLFLOW_EXPERIMENT_NAME)

    X_train, X_test, y_train, y_test, cat_cols = prepare_data()
    joblib.dump((X_test, y_test), ARTIFACTS_DIR / "test.pkl")

    for run_name, model in MODELS.items():
        with mlflow.start_run(run_name=run_name):

            pipeline = build_classifier_pipeline(cat_cols, model)
            pipeline.fit(X_train, y_train)

            pred_proba = pipeline.predict_proba(X_test)[:, 1]
            y_pred     = (pred_proba >= THRESHOLD).astype(int)

            metrics = {
                "test_roc_auc":  roc_auc_score(y_test, pred_proba),
                "test_accuracy": accuracy_score(y_test, y_pred),
                "test_f1":       f1_score(y_test, y_pred),
                "test_recall_0": recall_score(y_test, y_pred, pos_label=0),
                "test_recall_1": recall_score(y_test, y_pred, pos_label=1),
            }

            roc_path = plot_roc_curve(y_test, pred_proba, run_name)
            pr_path  = plot_pr_curve(y_test, pred_proba, run_name)
            thr_path, best_threshold = plot_threshold_analysis(y_test, pred_proba, run_name)

            mlflow.log_param("model_name", run_name)
            mlflow.log_param("threshold", THRESHOLD)
            mlflow.log_param("best_threshold_f1", float(best_threshold))

            mlflow.log_metrics(metrics)

            mlflow.log_artifact(roc_path)
            mlflow.log_artifact(pr_path)
            mlflow.log_artifact(thr_path)

            mlflow.sklearn.log_model(pipeline, artifact_path="model")

            print(f"✅ {run_name}")
            for k, v in metrics.items():
                print(f"   {k}: {v:.4f}")
            print(f"   Best Threshold (F1): {best_threshold:.3f}")
            print()


if __name__ == "__main__":
    train()