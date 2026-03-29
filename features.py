"""Feature engineering utilities for training and live inference."""

from __future__ import annotations

import statistics
import time
from collections import deque
from dataclasses import dataclass
from typing import Iterable

import numpy as np


FEATURE_COLUMNS = [
    "reference_price",
    "strike",
    "seconds_to_expiry",
    "distance_to_strike",
    "ret_1m",
    "ret_3m",
    "ret_5m",
    "ret_10m",
    "vol_5m",
    "vol_15m",
    "kalshi_implied_prob",
]


@dataclass
class PricePoint:
    source: str
    price: float
    ts: float


class PriceHistory:
    def __init__(self, maxlen: int = 3600) -> None:
        self.points: deque[tuple[float, float]] = deque(maxlen=maxlen)

    def add(self, ts: float, price: float) -> None:
        self.points.append((ts, price))

    def _price_seconds_ago(self, now_ts: float, seconds: int) -> float | None:
        target = now_ts - seconds
        candidate = None
        for ts, price in reversed(self.points):
            if ts <= target:
                candidate = price
                break
        return candidate

    def return_over(self, now_ts: float, seconds: int) -> float:
        if not self.points:
            return 0.0
        current = self.points[-1][1]
        past = self._price_seconds_ago(now_ts, seconds)
        if not past or past <= 0:
            return 0.0
        return (current / past) - 1.0

    def rolling_vol(self, now_ts: float, window_seconds: int) -> float:
        arr = [p for ts, p in self.points if ts >= now_ts - window_seconds]
        if len(arr) < 3:
            return 0.0
        returns = np.diff(np.log(np.asarray(arr, dtype=float)))
        if len(returns) < 2:
            return 0.0
        return float(np.std(returns))


def get_reference_price(
    all_prices: Iterable[PricePoint],
    max_age_seconds: int,
    now_ts: float | None = None,
) -> float | None:
    """Use median of all fresh prices and ignore stale feeds."""
    now_ts = now_ts or time.time()
    fresh = [p.price for p in all_prices if (now_ts - p.ts) <= max_age_seconds and p.price > 0]
    if not fresh:
        return None
    return float(statistics.median(fresh))


def build_feature_row(
    reference_price: float,
    strike: float,
    seconds_to_expiry: int,
    kalshi_implied_prob: float,
    history: PriceHistory,
    now_ts: float,
) -> dict[str, float]:
    return {
        "reference_price": reference_price,
        "strike": strike,
        "seconds_to_expiry": float(seconds_to_expiry),
        "distance_to_strike": reference_price - strike,
        "ret_1m": history.return_over(now_ts, 60),
        "ret_3m": history.return_over(now_ts, 180),
        "ret_5m": history.return_over(now_ts, 300),
        "ret_10m": history.return_over(now_ts, 600),
        "vol_5m": history.rolling_vol(now_ts, 300),
        "vol_15m": history.rolling_vol(now_ts, 900),
        "kalshi_implied_prob": kalshi_implied_prob,
    }
