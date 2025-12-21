from pathlib import Path
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from pipeline import build_classifier_pipeline


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "customer_dataset.csv"
ARTIFACTS_DIR = BASE_DIR / "artifacts"

ARTIFACTS_DIR.mkdir(exist_ok=True)


def main():
    df = pd.read_csv(DATA_PATH)

    df.drop(
        columns=["RowNumber", "CustomerId", "Surname", "Geography"],
        inplace=True,
        errors="ignore"
    )

    X = df.drop(columns=["Exited"])
    y = df["Exited"]

    categorical_cols = X.select_dtypes(include="object").columns.tolist()

    X_train, X_test, y_train, y_test = train_test_split(X,y,
        test_size=0.3,
        random_state=0,
    )

    pipeline = build_classifier_pipeline(categorical_cols)
    pipeline.fit(X_train, y_train)

    joblib.dump(pipeline, ARTIFACTS_DIR / "model.pkl")
    joblib.dump((X_test, y_test), ARTIFACTS_DIR / "test.pkl")
    THRESHOLD = 0.35
    joblib.dump(THRESHOLD, ARTIFACTS_DIR / "threshold.pkl")




    print("✅ Modelo treinado")


if __name__ == "__main__":
    main()
