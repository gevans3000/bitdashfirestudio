# BitDash Firestudio – TASKS.md

> **Goal:** Optimize 5-minute BTC scalping with SPX context through small, atomic tasks Codex can execute autonomously.

All tasks live in `task_queue.json` as `{ "id": number, "description": string, "status": "pending"|"done" }` objects. Keep this file synchronized with the checklist below so the harness always works from an accurate queue.

---

## Workflow
1. Review `context.snapshot.md`, `memory.md` and `logs/commit.log` for context.
2. Run `npm run auto` to let the AutoTaskRunner process tasks sequentially.
3. Tasks are loaded from `task_queue.json`; keep this file in sync with the checklist.
4. Each task runs lint, test and backtest.
5. After success the task is marked `[x]`, `signals.json` and `task_queue.json` are updated.
6. Append the 333‑token commit summary with hash and files to `context.snapshot.md` and `memory.md` using the one-line format described in `AGENTS.md`.
7. The commit message begins with `Task <number>:` so the git log stays in sync with the memory files.
8. Run `npm run commitlog` after committing to capture the latest history.
9. Review `logs/commit.log` before starting a new session and reload recent summaries from `memory.md`.
10. The runner rebases on `main` and pushes after each commit.
11. Reference commit hashes from `memory.md` when creating follow-up tasks.

---

## Completed Tasks
- [x] Task 0: initial dependency install attempt
- [x] Task 1–16: prior setup and feature groundwork

---

## Pending Tasks

### Scalper Add-ons
- [x] Task 17: highlight large resting orders on depth heat map
- [x] Task 18: connect to Bybit liquidation WebSocket
- [x] Task 19: aggregate liquidations into clusters
- [x] Task 20: overlay liquidation clusters on chart
 - [x] Task 21: fetch open-interest data from Bybit
 - [x] Task 22: compute 1 h open-interest delta
 - [x] Task 23: chart open-interest delta line
 - [x] Task 24: fetch funding rate schedule
 - [x] Task 25: display countdown timer to next funding
 - [x] Task 26: compute Bollinger Band width
 - [x] Task 27: alert when width falls below threshold
 - [ ] Task 28: build volume profile from recent data
 - [ ] Task 29: show distance to nearest volume peak
 - [ ] Task 30: fetch 1 h and 4 h candles
 - [ ] Task 31: compare 5 m EMA trend with higher timeframes
 - [ ] Task 32: flag upcoming high-impact economic events
 - [ ] Task 33: notify on daily Google Trends spike
 - [ ] Task 34: integrate mempool fee pressure gauge
 - [ ] Task 35: implement risk/position-size calculator logic
 - [ ] Task 36: add UI for risk/position-size calculator
 - [ ] Task 37: track trades for session stats
 - [ ] Task 38: display session P&L and hit rate

### Volume & Liquidity
 - [ ] Task 39: fetch SPY volume using Yahoo Finance
 - [ ] Task 40: correlate SPY volume with BTC moves

### Sentiment & Correlation
 - [ ] Task 41: collect Crypto-Twitter sentiment data
 - [ ] Task 42: compute short-term sentiment index
 - [ ] Task 43: stream liquidations and open interest
 - [ ] Task 44: merge liquidation and OI signals
 - [ ] Task 45: calculate rolling BTC/SPX correlation
 - [ ] Task 46: chart correlation over time

### Macro Indicators
 - [ ] Task 47: pull Fed funds rate schedule
 - [ ] Task 48: integrate economic-event calendar feed

### Data Management
 - [ ] Task 49: Binance order-book WebSocket
 - [ ] Task 50: stream Binance OHLCV candles
 - [ ] Task 51: CoinGecko historical BTC fetcher
 - [ ] Task 52: Yahoo Finance fetcher for SPX/SPY/VIX/DXY
 - [ ] Task 53: FRED macro series fetcher
 - [ ] Task 54: caching layer with 15 s TTL and rate limits

### Alerts & Notifications
 - [ ] Task 55: show toast alerts on signals
 - [ ] Task 56: configurable alert panel
 - [ ] Task 57: quick-entry trade journal
 - [ ] Task 58: annotate historical signals on the chart

### Testing & Validation
 - [ ] Task 59: unit tests for each indicator
 - [ ] Task 60: validate indicators on historical data
 - [ ] Task 61: real-time backtester with metrics

### Documentation & Configuration
 - [ ] Task 62: generate API reference documentation
 - [ ] Task 63: create user guide
 - [ ] Task 64: write developer setup guide
 - [ ] Task 65: document `signals.json` thresholds
 - [ ] Task 66: describe each configuration parameter

### UI Enhancements
 - [ ] Task 67: key-level proximity indicators
 - [ ] Task 68: customizable TradingView widget
 - [ ] Task 69: one-click indicator toggles

### Performance & Monitoring
 - [ ] Task 70: real-time strategy-performance tracker
 - [ ] Task 71: monitor data latency and system load

---

## Definition of Done
- Priority widgets and indicators are functional and visible.
- BUY/SELL signals render in the UI within two seconds of candle close.
- Test, lint and backtest logs are saved under `/logs`.
- Each completed task is auto-committed with a passing build and updated `signals.json`.
- `task_queue.json`, `context.snapshot.md` and `memory.md` reflect the new status.
- Git log mirrors TASKS.md history for quick recovery.
- `logs/commit.log` provides a concise memory dump via `npm run commitlog`.
- Follow-up tasks mention the commit hash that introduced related changes.
