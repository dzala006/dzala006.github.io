"""Central configuration for the Kalshi BTC 15-minute trading bot."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

# Load .env from project root by default
load_dotenv()


@dataclass(frozen=True)
class Settings:
    # General
    paper_mode: bool = os.getenv("PAPER_MODE", "true").lower() == "true"
    loop_sleep_seconds: float = float(os.getenv("LOOP_SLEEP_SECONDS", "2"))
    cooldown_seconds: int = int(os.getenv("COOLDOWN_SECONDS", "60"))

    # Risk / strategy
    max_spend_per_trade: float = float(os.getenv("MAX_SPEND_PER_TRADE", "1.0"))
    min_edge_to_trade: float = float(os.getenv("MIN_EDGE_TO_TRADE", "0.08"))
    min_seconds_to_expiry: int = int(os.getenv("MIN_SECONDS_TO_EXPIRY", "40"))
    max_seconds_to_expiry: int = int(os.getenv("MAX_SECONDS_TO_EXPIRY", "900"))

    # Data freshness controls
    max_price_age_seconds: int = int(os.getenv("MAX_PRICE_AGE_SECONDS", "5"))
    max_webull_price_age_seconds: int = int(os.getenv("MAX_WEBULL_PRICE_AGE_SECONDS", "10"))

    # Model / data paths
    data_dir: Path = Path(os.getenv("DATA_DIR", "data"))
    model_path: Path = Path(os.getenv("MODEL_PATH", "models/logistic_model.joblib"))
    historical_csv: Path = Path(os.getenv("HISTORICAL_CSV", "data/historical_samples.csv"))
    decision_log_csv: Path = Path(os.getenv("DECISION_LOG_CSV", "logs/decisions.csv"))

    # Price feeds
    coinbase_ws_url: str = os.getenv("COINBASE_WS_URL", "wss://ws-feed.exchange.coinbase.com")
    crypto_rest_url: str = os.getenv(
        "CRYPTO_REST_URL", "https://api.crypto.com/v2/public/get-ticker"
    )
    crypto_instrument_name: str = os.getenv("CRYPTO_INSTRUMENT_NAME", "BTC_USDT")
    webull_price_url: str = os.getenv("WEBULL_PRICE_URL", "")

    # Kalshi API
    kalshi_base_url: str = os.getenv("KALSHI_BASE_URL", "https://api.elections.kalshi.com/trade-api/v2")
    kalshi_api_key_id: str = os.getenv("KALSHI_API_KEY_ID", "")
    kalshi_private_key_path: str = os.getenv("KALSHI_PRIVATE_KEY_PATH", "")

    # Optional fixed ticker override
    kalshi_market_ticker: str = os.getenv("KALSHI_MARKET_TICKER", "")


SETTINGS = Settings()

# Ensure common directories exist.
for parent in (
    SETTINGS.data_dir,
    SETTINGS.model_path.parent,
    SETTINGS.decision_log_csv.parent,
):
    parent.mkdir(parents=True, exist_ok=True)
