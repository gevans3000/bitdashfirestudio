# BitDash Firestudio – TASKS.md

> **Goal:** Optimize 5-minute BTC scalping with SPX context through small, atomic tasks Codex can execute autonomously.

---

## Workflow
1. Run `npm run auto` to let the AutoTaskRunner process tasks sequentially.
2. Tasks are loaded from `task_queue.json`; keep this file in sync with the checklist.
3. Each task runs lint, test and backtest.
4. After success the task is marked `[x]`, `signals.json` and `task_queue.json` are updated.
5. Append the 333‑token commit summary with hash and files to `context.snapshot.md` and `memory.md`.
6. The commit message follows `Task <number>:` so the git log stays in sync with the memory files.
7. The runner rebases on `main` and pushes after each commit.

---

## Completed Tasks
- [x] Task 0: initial dependency install attempt
- [x] Task 1–16: prior setup and feature groundwork

---

## Pending Tasks

### Scalper Add-ons
- [x] Task 17: highlight large resting orders on depth heat map
- [ ] Task 18: display Bybit liquidation clusters
- [ ] Task 19: chart 1 h open-interest delta
- [ ] Task 20: add funding-rate countdown timer
- [ ] Task 21: alert when Bollinger Band width drops below threshold
- [ ] Task 22: show distance to nearest volume-profile peak
- [ ] Task 23: compare 5 m trend with 1 h and 4 h EMAs
- [ ] Task 24: flag upcoming high-impact economic events
- [ ] Task 25: notify on daily Google Trends spike
- [ ] Task 26: integrate mempool fee pressure gauge
- [ ] Task 27: quick risk/position-size calculator
- [ ] Task 28: session stats tracker for P&L and hit rate

### Volume & Liquidity
- [ ] Task 29: fetch SPY volume using Yahoo Finance

### Sentiment & Correlation
- [ ] Task 30: gauge short-term Crypto-Twitter sentiment
- [ ] Task 31: real-time liquidations and open interest
- [ ] Task 32: rolling BTC/SPX correlation over 1 h

### Macro Indicators
- [ ] Task 33: pull Fed funds rate schedule
- [ ] Task 34: integrate economic-event calendar

### Data Management
- [ ] Task 35: Binance WebSocket for order book and OHLCV
- [ ] Task 36: CoinGecko historical BTC fetcher
- [ ] Task 37: Yahoo Finance fetcher for SPX/SPY/VIX/DXY
- [ ] Task 38: FRED macro series fetcher
- [ ] Task 39: cache REST calls 15–30 s and enforce 5 calls/min rate limit

### Alerts & Notifications
- [ ] Task 40: toast alerts on generated signals
- [ ] Task 41: configurable alert panel
- [ ] Task 42: quick-entry trade journal
- [ ] Task 43: annotate historical signals on the chart

### Testing & Validation
- [ ] Task 44: unit tests for each indicator
- [ ] Task 45: validate indicator results on historical data
- [ ] Task 46: real-time backtester with win rate and drawdown metrics

### Documentation & Configuration
- [ ] Task 47: generate API reference documentation
- [ ] Task 48: create user guide
- [ ] Task 49: write developer setup guide
- [ ] Task 50: document `signals.json` thresholds
- [ ] Task 51: describe each configuration parameter

### UI Enhancements
- [ ] Task 52: key-level proximity indicators
- [ ] Task 53: customizable TradingView widget
- [ ] Task 54: one-click indicator toggles

### Performance & Monitoring
- [ ] Task 55: real-time strategy-performance tracker
- [ ] Task 56: monitor data latency and system load

---

## Definition of Done
- Priority widgets and indicators are functional and visible.
- BUY/SELL signals render in the UI within two seconds of candle close.
- Test, lint and backtest logs are saved under `/logs`.
- Each completed task is auto-committed with a passing build and updated `signals.json`.
- `task_queue.json`, `context.snapshot.md` and `memory.md` reflect the new status.
- Git log mirrors TASKS.md history for quick recovery.
