"""Crypto.com feed client via public REST endpoint."""

from __future__ import annotations

import time
from dataclasses import dataclass

import requests


@dataclass
class PricePoint:
    source: str
    price: float
    ts: float


class CryptoComFeed:
    def __init__(self, base_url: str, instrument_name: str, timeout: float = 2.0) -> None:
        self.base_url = base_url
        self.instrument_name = instrument_name
        self.timeout = timeout

    def get_price(self) -> PricePoint | None:
        try:
            params = {"instrument_name": self.instrument_name}
            resp = requests.get(self.base_url, params=params, timeout=self.timeout)
            resp.raise_for_status()
            payload = resp.json()
            # Expected shape: {"result": {"data": [{"a": "ask", "b": "bid", ...}]}}
            rows = payload.get("result", {}).get("data", [])
            if not rows:
                return None
            row = rows[0]
            ask = float(row.get("a", 0) or 0)
            bid = float(row.get("b", 0) or 0)
            price = (ask + bid) / 2 if ask > 0 and bid > 0 else float(row.get("k", 0) or 0)
            if price <= 0:
                return None
            return PricePoint(source="crypto_com", price=price, ts=time.time())
        except Exception:
            return None
