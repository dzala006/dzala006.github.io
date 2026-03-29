"""Historical dataset utilities."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from features import FEATURE_COLUMNS


REQUIRED_COLUMNS = [
    "timestamp",
    *FEATURE_COLUMNS,
    "final_outcome_yes",
]


def load_historical_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(
            f"Historical CSV not found: {path}. Create it with required columns: {REQUIRED_COLUMNS}"
        )

    df = pd.read_csv(path)
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns in {path}: {missing}")

    df = df.dropna(subset=FEATURE_COLUMNS + ["final_outcome_yes"])
    return df
