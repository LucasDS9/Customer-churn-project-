from imblearn.pipeline import Pipeline
from imblearn.over_sampling import SMOTE

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OrdinalEncoder


def build_classifier_pipeline(categorical_cols, model):  

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
            ("model", model),  
        ]
    )

    return pipeline