"""Train and save a simple logistic regression model."""

from __future__ import annotations

import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import log_loss, roc_auc_score
from sklearn.model_selection import train_test_split

from config import SETTINGS
from features import FEATURE_COLUMNS
from historical_loader import load_historical_csv


def main() -> None:
    df = load_historical_csv(SETTINGS.historical_csv)

    X = df[FEATURE_COLUMNS]
    y = df["final_outcome_yes"].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, shuffle=False
    )

    model = LogisticRegression(max_iter=1000)
    model.fit(X_train, y_train)

    probs = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, probs) if len(set(y_test)) > 1 else float("nan")
    loss = log_loss(y_test, probs)

    joblib.dump(model, SETTINGS.model_path)
    print(f"Saved model to: {SETTINGS.model_path}")
    print(f"Test AUC: {auc:.4f}")
    print(f"Test LogLoss: {loss:.4f}")


if __name__ == "__main__":
    main()
