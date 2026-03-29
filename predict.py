"""Runtime prediction helper."""

from __future__ import annotations

import joblib
import pandas as pd

from features import FEATURE_COLUMNS


class Predictor:
    def __init__(self, model_path: str) -> None:
        self.model = joblib.load(model_path)

    def predict_prob_yes(self, feature_row: dict[str, float]) -> float:
        X = pd.DataFrame([[feature_row[c] for c in FEATURE_COLUMNS]], columns=FEATURE_COLUMNS)
        return float(self.model.predict_proba(X)[0][1])
