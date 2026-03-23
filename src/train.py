from pathlib import Path

import joblib
import mlflow
import mlflow.sklearn
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import shap

from xgboost import XGBClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
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
    "xgboost": XGBClassifier(
        n_estimators=500,
        learning_rate=0.005,
        max_depth=4,
        colsample_bytree=0.5,
        random_state=0,
        n_jobs=-1,
    ),
    "random_forest": RandomForestClassifier(
        n_estimators=400,
        max_depth=6,
        max_features=0.5,
        random_state=0,
        n_jobs=-1,
    ),
    "gradient_boosting": GradientBoostingClassifier(
        n_estimators=500,
        learning_rate=0.005,
        max_depth=4,
        subsample=0.8,
        random_state=0,
    ),
}

COLS_DROP = [
    "RowNumber", "CustomerId", "Surname", "Geography",
    "Balance", "NumOfProducts", "HasCrCard", "Card Type", "Point Earned",
]


def prepare_data():
    df = pd.read_csv(DATA_PATH)
    df.drop(columns=COLS_DROP, inplace=True, errors="ignore")

    df['risco_composto'] = (
        (df['Satisfaction Score'] <= 2).astype(int) * 3 +
        df['Complain'] * 2 +
        (1 - df['IsActiveMember']) * 1
    )

    df['risco_cliente'] = (
        (1 - df['IsActiveMember']) * 0.40 +
        df['Complain'] * 0.35 +
        (1 - df['Tenure'] / df['Tenure'].max()) * 0.25
    )

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


def plot_shap_summary(pipeline, X_test, run_name):
    # Extract the fitted model from the last step of the pipeline
    model = pipeline.named_steps[list(pipeline.named_steps.keys())[-1]]

    # Transform X_test through all steps except the final estimator
    # Steps like SMOTE are resamplers (no transform), so we skip them
    preprocessor_steps = list(pipeline.named_steps.keys())[:-1]
    X_transformed = X_test.copy()
    feature_names = None
    for step_name in preprocessor_steps:
        step = pipeline.named_steps[step_name]
        if hasattr(step, "transform"):
            X_transformed = step.transform(X_transformed)
            # Recover feature names after the preprocessor step if available
            if hasattr(step, "get_feature_names_out"):
                feature_names = step.get_feature_names_out()

    # Convert to DataFrame to preserve feature names in the SHAP plot
    if feature_names is not None:
        X_transformed = pd.DataFrame(X_transformed, columns=feature_names)

    explainer   = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_transformed)

    # RandomForest returns a list of arrays (one per class) — take class 1 (churn)
    if isinstance(shap_values, list):
        shap_values = shap_values[1]

    plt.figure()
    shap.summary_plot(shap_values, X_transformed, show=False)
    plt.title(f"SHAP Summary - {run_name}")

    path = ARTIFACTS_DIR / f"shap_{run_name}.png"
    plt.savefig(path, bbox_inches="tight")
    plt.close()

    return path


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

            roc_path  = plot_roc_curve(y_test, pred_proba, run_name)
            pr_path   = plot_pr_curve(y_test, pred_proba, run_name)
            thr_path, best_threshold = plot_threshold_analysis(y_test, pred_proba, run_name)
            shap_path = plot_shap_summary(pipeline, X_test, run_name)

            mlflow.log_param("model_name", run_name)
            mlflow.log_param("threshold", THRESHOLD)
            mlflow.log_param("best_threshold_f1", float(best_threshold))

            mlflow.log_metrics(metrics)

            mlflow.log_artifact(roc_path)
            mlflow.log_artifact(pr_path)
            mlflow.log_artifact(thr_path)
            mlflow.log_artifact(shap_path)

            mlflow.sklearn.log_model(pipeline, artifact_path="model")

            print(f"✅ {run_name}")
            for k, v in metrics.items():
                print(f"   {k}: {v:.4f}")
            print(f"   Best Threshold (F1): {best_threshold:.3f}")
            print()


if __name__ == "__main__":
    train()
    