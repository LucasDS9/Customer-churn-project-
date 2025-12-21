from pathlib import Path
import joblib
import json

from sklearn.metrics import (
    classification_report,
    roc_auc_score,
    confusion_matrix
)


BASE_DIR = Path(__file__).resolve().parent.parent
ARTIFACTS_DIR = BASE_DIR / "artifacts"

MODEL_PATH = ARTIFACTS_DIR / "model.pkl"
TEST_PATH = ARTIFACTS_DIR / "test.pkl"

METRICS_PATH = ARTIFACTS_DIR / "metrics.json"
THRESHOLD = 0.35


def main():

    model = joblib.load(MODEL_PATH)
    X_test, y_test = joblib.load(TEST_PATH)


    pred_proba = model.predict_proba(X_test)[:, 1]
    y_pred = (pred_proba > THRESHOLD).astype(int)


    report = classification_report(y_test, y_pred, output_dict=True)
    roc_auc = roc_auc_score(y_test, pred_proba)
    cm = confusion_matrix(y_test, y_pred)

    print("📊 Classification Report:")
    print(classification_report(y_test, y_pred))
    print(f"ROC-AUC: {roc_auc:.4f}")
    print("Confusion Matrix:")
    print(cm)


    metrics = {
        "roc_auc": roc_auc,
        "threshold": THRESHOLD,
        "confusion_matrix": cm.tolist(),
        "classification_report": report,
    }

    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=4)

    print("\n✅ Métricas salvas em artifacts/metrics.json")


if __name__ == "__main__":
    main()
