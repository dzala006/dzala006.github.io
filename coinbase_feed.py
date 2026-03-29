"""Coinbase feed client.

Simple implementation:
- Uses REST for current spot price (reliable and easy for beginners).
- Optionally attempts WebSocket subscription in the future.
"""

from __future__ import annotations

import time
from dataclasses import dataclass

import requests


@dataclass
class PricePoint:
    source: str
    price: float
    ts: float


class CoinbaseFeed:
    def __init__(self, timeout: float = 2.0) -> None:
        self.timeout = timeout
        self.rest_url = "https://api.coinbase.com/v2/prices/BTC-USD/spot"

    def get_price(self) -> PricePoint | None:
        """Fetch BTC-USD spot from Coinbase public REST endpoint."""
        try:
            resp = requests.get(self.rest_url, timeout=self.timeout)
            resp.raise_for_status()
            payload = resp.json()
            amount = float(payload["data"]["amount"])
            return PricePoint(source="coinbase", price=amount, ts=time.time())
        except Exception:
            return None
