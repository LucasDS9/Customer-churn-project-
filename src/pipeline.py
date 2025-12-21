from imblearn.pipeline import Pipeline
from imblearn.over_sampling import SMOTE

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OrdinalEncoder
from sklearn.ensemble import RandomForestClassifier


def build_classifier_pipeline(categorical_cols):

    preprocess = ColumnTransformer(
        transformers=[
            (
                "cat",
                OrdinalEncoder(
                    handle_unknown="use_encoded_value",
                    unknown_value=-1
                ),
                categorical_cols
            )
        ],
        remainder="passthrough",
    )

    pipeline = Pipeline(
        steps=[
            ("preprocess", preprocess),
            ("smote", SMOTE(random_state=0)),
            (
                "model",
                RandomForestClassifier(
                    n_estimators=10,
                    random_state=0
                ),
            ),
        ]
    )

    return pipeline
