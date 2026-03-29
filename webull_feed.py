"""Optional Webull-like feed adapter.

This module expects WEBULL_PRICE_URL to return JSON with one of:
- {"price": 68000.12}
- {"close": 68000.12}
- {"last": 68000.12}

If URL is blank or fetch fails, it returns None.
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


class WebullFeed:
    def __init__(self, url: str, timeout: float = 2.0) -> None:
        self.url = url.strip()
        self.timeout = timeout

    def get_price(self) -> PricePoint | None:
        if not self.url:
            return None

        try:
            resp = requests.get(self.url, timeout=self.timeout)
            resp.raise_for_status()
            data = resp.json()
            for key in ("price", "close", "last"):
                if key in data:
                    price = float(data[key])
                    if price > 0:
                        return PricePoint(source="webull", price=price, ts=time.time())
            return None
        except Exception:
            return None
