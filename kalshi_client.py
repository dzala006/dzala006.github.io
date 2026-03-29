"""Kalshi API wrapper with paper/live mode support.

Notes:
- In paper mode, order placement is simulated locally.
- In live mode, this client attempts REST calls against the configured base URL.
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import requests


@dataclass
class TopOfBook:
    yes_ask: float
    no_ask: float


class KalshiClient:
    def __init__(
        self,
        base_url: str,
        api_key_id: str,
        private_key_path: str,
        paper_mode: bool = True,
        timeout: float = 4.0,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_key_id = api_key_id
        self.private_key_path = private_key_path
        self.paper_mode = paper_mode
        self.timeout = timeout
        self._last_order_id = 0

    def _headers(self) -> dict[str, str]:
        headers = {"accept": "application/json", "content-type": "application/json"}
        if self.api_key_id:
            headers["KALSHI-ACCESS-KEY"] = self.api_key_id
        return headers

    def get_balance(self) -> float:
        if self.paper_mode:
            return 1000.0
        try:
            resp = requests.get(
                f"{self.base_url}/portfolio/balance", headers=self._headers(), timeout=self.timeout
            )
            resp.raise_for_status()
            data = resp.json()
            return float(data.get("balance", 0.0))
        except Exception:
            return 0.0

    def detect_active_btc_15m_market(self) -> str | None:
        """Best-effort market detection using public list endpoint."""
        try:
            resp = requests.get(
                f"{self.base_url}/markets", headers=self._headers(), timeout=self.timeout
            )
            resp.raise_for_status()
            markets = resp.json().get("markets", [])
            now = datetime.now(timezone.utc)

            candidates: list[tuple[float, str]] = []
            for m in markets:
                ticker = str(m.get("ticker", ""))
                title = str(m.get("title", "")).lower()
                if "btc" not in ticker.lower() and "bitcoin" not in title:
                    continue
                if "15" not in title and "15" not in ticker:
                    continue
                close_time = m.get("close_time") or m.get("expiration_time")
                if not close_time:
                    continue
                try:
                    dt = datetime.fromisoformat(close_time.replace("Z", "+00:00"))
                except Exception:
                    continue
                if dt <= now:
                    continue
                candidates.append(((dt - now).total_seconds(), ticker))

            if not candidates:
                return None
            candidates.sort(key=lambda x: x[0])
            return candidates[0][1]
        except Exception:
            return None

    def get_market_snapshot(self, ticker: str) -> dict[str, Any] | None:
        try:
            resp = requests.get(
                f"{self.base_url}/markets/{ticker}", headers=self._headers(), timeout=self.timeout
            )
            resp.raise_for_status()
            return resp.json().get("market", resp.json())
        except Exception:
            return None

    def get_top_of_book(self, ticker: str) -> TopOfBook | None:
        """Extract YES/NO ask prices in 0-1 probability scale."""
        snap = self.get_market_snapshot(ticker)
        if not snap:
            return None

        # common field names seen across versions
        yes_ask = snap.get("yes_ask") or snap.get("best_yes_ask") or snap.get("yesAsk")
        no_ask = snap.get("no_ask") or snap.get("best_no_ask") or snap.get("noAsk")

        if yes_ask is None or no_ask is None:
            return None

        yes_ask = float(yes_ask)
        no_ask = float(no_ask)

        # If prices are in cents, normalize to probabilities.
        if yes_ask > 1.0 or no_ask > 1.0:
            yes_ask /= 100.0
            no_ask /= 100.0

        return TopOfBook(yes_ask=yes_ask, no_ask=no_ask)

    def place_order(
        self,
        ticker: str,
        side: str,
        count: int,
        price: float,
    ) -> dict[str, Any]:
        if count <= 0:
            return {"ok": False, "error": "count must be > 0"}

        if self.paper_mode:
            self._last_order_id += 1
            return {
                "ok": True,
                "paper": True,
                "order_id": f"paper-{self._last_order_id}",
                "ticker": ticker,
                "side": side,
                "count": count,
                "price": price,
                "ts": time.time(),
            }

        payload = {
            "ticker": ticker,
            "side": "yes" if side.upper() == "YES" else "no",
            "action": "buy",
            "count": count,
            "type": "market",
            "max_price": int(round(price * 100)),
        }
        try:
            resp = requests.post(
                f"{self.base_url}/portfolio/orders",
                headers=self._headers(),
                json=payload,
                timeout=self.timeout,
            )
            resp.raise_for_status()
            body = resp.json()
            body["ok"] = True
            return body
        except Exception as exc:
            return {"ok": False, "error": str(exc)}
