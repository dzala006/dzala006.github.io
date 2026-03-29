"""Main selective Kalshi BTC 15-minute trading bot.

Default behavior:
- paper mode ON
- only trades when estimated edge >= threshold
- holds until payout (no active exits in this simple version)
"""

from __future__ import annotations

import csv
import math
import time
from datetime import datetime, timezone
from pathlib import Path

from coinbase_feed import CoinbaseFeed
from config import SETTINGS
from crypto_com_feed import CryptoComFeed
from features import PriceHistory, build_feature_row, get_reference_price
from kalshi_client import KalshiClient
from predict import Predictor
from webull_feed import WebullFeed


def parse_market_fields(snapshot: dict) -> tuple[float | None, int | None]:
    strike = snapshot.get("strike") or snapshot.get("strike_price")
    close_time = snapshot.get("close_time") or snapshot.get("expiration_time")

    strike_value = float(strike) if strike is not None else None

    seconds_to_expiry = None
    if close_time:
        try:
            dt = datetime.fromisoformat(str(close_time).replace("Z", "+00:00"))
            seconds_to_expiry = int((dt - datetime.now(timezone.utc)).total_seconds())
        except Exception:
            seconds_to_expiry = None

    return strike_value, seconds_to_expiry


def ensure_csv(path: Path) -> None:
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(
            [
                "timestamp",
                "btc_reference_price",
                "strike",
                "seconds_to_expiry",
                "predicted_prob_yes",
                "kalshi_yes_price",
                "kalshi_no_price",
                "edge_yes",
                "edge_no",
                "action_taken",
                "order_price",
                "contracts",
                "final_outcome",
                "pnl",
            ]
        )


def append_decision(path: Path, row: list) -> None:
    with path.open("a", newline="") as f:
        csv.writer(f).writerow(row)


def main() -> None:
    ensure_csv(SETTINGS.decision_log_csv)

    coinbase = CoinbaseFeed()
    crypto = CryptoComFeed(
        base_url=SETTINGS.crypto_rest_url,
        instrument_name=SETTINGS.crypto_instrument_name,
    )
    webull = WebullFeed(SETTINGS.webull_price_url)

    kalshi = KalshiClient(
        base_url=SETTINGS.kalshi_base_url,
        api_key_id=SETTINGS.kalshi_api_key_id,
        private_key_path=SETTINGS.kalshi_private_key_path,
        paper_mode=SETTINGS.paper_mode,
    )

    predictor = Predictor(str(SETTINGS.model_path))
    history = PriceHistory()

    ticker = SETTINGS.kalshi_market_ticker or kalshi.detect_active_btc_15m_market()
    if not ticker:
        raise RuntimeError(
            "Unable to detect active BTC 15-minute ticker. Set KALSHI_MARKET_TICKER in .env"
        )

    print(f"Running bot on ticker={ticker} | paper_mode={SETTINGS.paper_mode}")
    last_trade_ts = 0.0

    while True:
        now = time.time()

        price_points = []
        for feed in (coinbase, crypto, webull):
            p = feed.get_price()
            if p:
                price_points.append(p)

        reference = get_reference_price(price_points, max_age_seconds=SETTINGS.max_price_age_seconds)
        if reference is None:
            print("No fresh price feeds available, skipping loop.")
            time.sleep(SETTINGS.loop_sleep_seconds)
            continue

        history.add(now, reference)

        book = kalshi.get_top_of_book(ticker)
        snapshot = kalshi.get_market_snapshot(ticker)
        if not book or not snapshot:
            print("No Kalshi snapshot/book available, skipping loop.")
            time.sleep(SETTINGS.loop_sleep_seconds)
            continue

        strike, seconds_to_expiry = parse_market_fields(snapshot)
        if strike is None or seconds_to_expiry is None:
            print("Unable to parse strike/expiry from market snapshot.")
            time.sleep(SETTINGS.loop_sleep_seconds)
            continue

        if not (SETTINGS.min_seconds_to_expiry <= seconds_to_expiry <= SETTINGS.max_seconds_to_expiry):
            time.sleep(SETTINGS.loop_sleep_seconds)
            continue

        implied_prob_yes = float(book.yes_ask)
        feat = build_feature_row(
            reference_price=reference,
            strike=strike,
            seconds_to_expiry=seconds_to_expiry,
            kalshi_implied_prob=implied_prob_yes,
            history=history,
            now_ts=now,
        )
        predicted_prob_yes = predictor.predict_prob_yes(feat)

        edge_yes = predicted_prob_yes - book.yes_ask
        edge_no = (1.0 - predicted_prob_yes) - book.no_ask

        action = "HOLD"
        order_price = ""
        contracts = 0

        in_cooldown = (now - last_trade_ts) < SETTINGS.cooldown_seconds
        if not in_cooldown:
            if edge_yes >= SETTINGS.min_edge_to_trade and book.yes_ask > 0:
                contracts = math.floor(SETTINGS.max_spend_per_trade / book.yes_ask)
                if contracts > 0:
                    result = kalshi.place_order(ticker=ticker, side="YES", count=contracts, price=book.yes_ask)
                    if result.get("ok"):
                        action = "BUY_YES"
                        order_price = book.yes_ask
                        last_trade_ts = now
            elif edge_no >= SETTINGS.min_edge_to_trade and book.no_ask > 0:
                contracts = math.floor(SETTINGS.max_spend_per_trade / book.no_ask)
                if contracts > 0:
                    result = kalshi.place_order(ticker=ticker, side="NO", count=contracts, price=book.no_ask)
                    if result.get("ok"):
                        action = "BUY_NO"
                        order_price = book.no_ask
                        last_trade_ts = now

        append_decision(
            SETTINGS.decision_log_csv,
            [
                datetime.now(timezone.utc).isoformat(),
                round(reference, 2),
                strike,
                seconds_to_expiry,
                round(predicted_prob_yes, 4),
                round(book.yes_ask, 4),
                round(book.no_ask, 4),
                round(edge_yes, 4),
                round(edge_no, 4),
                action,
                order_price,
                contracts,
                "",
                "",
            ],
        )

        print(
            f"ref={reference:.2f} strike={strike} tte={seconds_to_expiry}s "
            f"p_yes={predicted_prob_yes:.3f} yes={book.yes_ask:.3f} no={book.no_ask:.3f} "
            f"edge_yes={edge_yes:.3f} edge_no={edge_no:.3f} action={action}"
        )

        time.sleep(SETTINGS.loop_sleep_seconds)


if __name__ == "__main__":
    main()
