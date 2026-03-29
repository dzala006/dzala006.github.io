# Simple Kalshi BTC 15-Minute Trading Bot (Python)

This is a **beginner-friendly, selective** trading bot for Kalshi BTC 15-minute up/down markets.

It does **not** trade constantly. It only trades when the model thinks Kalshi odds are mispriced by a strong edge.

## How this bot tries to make money

1. Pulls live BTC prices from multiple sources (Coinbase + Crypto.com + optional Webull).
2. Builds a **reference BTC price** as the **median** of fresh sources (robust to bad ticks).
3. Builds features from current market state + recent BTC behavior.
4. Uses a trained logistic regression model to estimate:
   - `predicted_prob_yes` = true probability contract settles YES.
5. Compares this to Kalshi implied prices:
   - `edge_yes = predicted_prob_yes - kalshi_yes_price`
   - `edge_no = (1 - predicted_prob_yes) - kalshi_no_price`
6. Only trades when edge >= 0.08 (configurable).

The contract settles on a **60-second average** near expiration (not one tick). The model includes trend + volatility + time-to-expiry + distance-to-strike so it can better handle this.

---

## Project files

- `config.py` - all config in one place (from `.env`)
- `coinbase_feed.py` - Coinbase BTC feed
- `crypto_com_feed.py` - Crypto.com BTC feed
- `webull_feed.py` - optional extra feed
- `kalshi_client.py` - Kalshi market/balance/order API wrapper
- `features.py` - feature engineering + reference price
- `historical_loader.py` - load historical training data
- `train_model.py` - train/save logistic regression model
- `predict.py` - load model + predict probability
- `bot.py` - main trading loop
- `.env.example` - env vars template
- `requirements.txt` - dependencies

---

## Setup (local)

## 1) Python
Use Python 3.11+.

## 2) Install dependencies
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 3) Configure environment
```bash
cp .env.example .env
```
Open `.env` and set at minimum:
- `PAPER_MODE=true` (default and recommended)
- `KALSHI_API_KEY_ID`
- `KALSHI_PRIVATE_KEY_PATH`
- optionally `KALSHI_MARKET_TICKER` for a known active BTC 15m ticker

> Credentials go in `.env` (`KALSHI_API_KEY_ID`, `KALSHI_PRIVATE_KEY_PATH`).

## 4) Create historical dataset
Create `data/historical_samples.csv` with columns:

- `timestamp`
- `reference_price`
- `strike`
- `seconds_to_expiry`
- `distance_to_strike`
- `ret_1m`
- `ret_3m`
- `ret_5m`
- `ret_10m`
- `vol_5m`
- `vol_15m`
- `kalshi_implied_prob`
- `final_outcome_yes` (1 for YES, 0 for NO)

## 5) Train model
```bash
python train_model.py
```
This saves model file to `models/logistic_model.joblib`.

## 6) Run bot
```bash
python bot.py
```

---

## Safety defaults

- Paper mode ON by default
- Max spend per trade = `$1.00`
- Cooldown = `60s`
- Edge threshold = `0.08`
- Trades are selective (most loops do nothing)

All risk settings are in `.env`.

---

## Notes

- This is a practical baseline, not guaranteed profit.
- Real-money mode requires reliable Kalshi auth/signing and careful testing.
- Start in paper mode and review `logs/decisions.csv` before any live deployment.
