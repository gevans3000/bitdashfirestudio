# BitDash Firestudio – TASKS.md
<!-- Write each task on one concise line (~33 tokens) so Codex ingests it as the next objective. -->

> **Goal:** Optimize 5-minute BTC scalping with SPX context through small, atomic tasks Codex can execute autonomously.

Each task below is prefixed with `Task <id>` and tracked directly in this file.

---

## Workflow

1. Review `memory.log` for context.
2. Run `npm run auto` to let the AutoTaskRunner process tasks sequentially from this file.
3. Each task runs lint, test and backtest.
4. After success the task is marked `[x]`.
6. Append the 333‑token commit summary with hash and files to `memory.log` using the one-line format described in `AGENTS.md`.
7. The commit message begins with `Task <number>:` and is checked by `commitlint` to keep the git log in sync.
8. Review recent summaries from `memory.log` before starting a new session.
10. The runner rebases on `main` and pushes after each commit.
11. Reference commit hashes from `memory.log` when creating follow-up tasks.

---

## Completed Tasks

- [x] Task 0: initial dependency install attempt
- [x] Task 1–16: prior setup and feature groundwork

---

## Pending Tasks

### Persistent Memory

- [x] Task 72: mem-001 create context snapshot
- [x] Task 73: mem-002 document memory scripts
- [x] Task 74: mem-003 backfill logs
- [x] Task 75: mem-004 update DocAgent protocol
- [x] Task 76: mem-005 document mem-ID counter
- [x] Task 77: mem-006 clarify DocAgent role
- [x] Task 78: mem-007 add CODEX_START instructions
- [x] Task 79: mem-008 remove outdated memory guide
- [x] Task 80: mem-009 backfill snapshot
- [x] Task 81: mem-010 record log entry
- [x] Task 82: create codex_context helper script
- [x] Task 83: add codex npm alias
- [x] Task 84: document codex workflow in AGENTS.md
- [x] Task 85: refine TASKS.md template
- [x] Task 86: document codex usage routine
- [x] Task 87: refine codex_context output formatting
- [x] Task 88: enhance npm codex alias
- [x] Task 89: expand workflow notes in AGENTS.md
- [x] Task 90: clarify TASKS.md guidance wording
- [x] Task 91: extend README with persistent memory section
- [x] Task 92: add file locking for memory writes

### Upcoming Enhancements

 - [x] Task 93: fix codex helper command by running ts-node scripts/codex-context.ts
 - [x] Task 94: document MEM_PATH and SNAPSHOT_PATH in README with rotation env vars
- [x] Task 95: consolidate memory scripts into memory-cli with yargs
- [x] Task 96: delete commit.log and update docs, tests, workflows
 - [x] Task 97: run npm ci only once in autoTaskRunner loop
 - [x] Task 98: rotate memory.log to 300 lines via pre-commit (obsolete)
 - [x] Task 99: cache dev dependencies with dev-deps script and CI caching
 - [x] Task 100: create setup-quickstart guide linked in README and AGENTS
- [x] Task 101: unify memory update hook with update-memory.ts script
- [x] Task 102: rewrite codex_context.sh with concise git/sed/jq and add test
- [x] Task 103: check COMMIT_EDITMSG for '^Task [0-9]+:' in pre-commit and abort if missing
- [x] Task 104: merge memory scripts into update-memory.ts with mem-update command and tests
- [x] Task 105: add archive-memory script and docs

- [x] Task 106: remove task_queue.json; autoTaskRunner reads TASKS.md; update docs
- [x] Task 107: rotate memory.log in update-memory.ts; drop pre-commit rotation
- [x] Task 108: delete obsolete memory scripts from scripts/ and package.json
- [x] Task 109: define single workflow entry; update README, AGENTS, CODEX_START
- [x] Task 110: investigate and fix broken post-commit hook
- [ ] Task 111: remove obsolete docs from repo
- [x] Task 112: refactor memory-cli with native subcommands; port mem-rotate, memgrep, mem-diff, mem-status and update tests
- [x] Task 113: move archive & restore utilities into scripts/memory and document usage
- [x] Task 114: remove update-memory-log.ts & update-snapshot.ts; ensure memory-cli handles update-log & snapshot-update and migrate tests
- [ ] Task 115: align rotate default with docs by keeping 300 lines
- [ ] Task 116: test `memory archive` moves logs to archive and `memory restore` restores them


### Bitcoin Dashboard

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
- [x] Task 28: build volume profile from recent data
- [x] Task 29: show distance to nearest volume peak
- [x] Task 30: fetch 1 h and 4 h candles
- [x] Task 31: compare 5 m EMA trend with higher timeframes
- [x] Task 32: flag upcoming high-impact economic events
- [ ] Task 33: notify on daily Google Trends spike
- [ ] Task 34: integrate mempool fee pressure gauge
- [ ] Task 35: implement risk/position-size calculator logic
- [ ] Task 36: add UI for risk/position-size calculator
- [ ] Task 37: track trades for session stats
- [ ] Task 38: display session P&L and hit rate

### Volume & Liquidity

- [ ] Task 39: fetch SPY volume using Yahoo Finance
- [ ] Task 40: correlate SPY volume with BTC moves

### Data Management

- [ ] Task 49: Binance order-book WebSocket
- [ ] Task 50: stream Binance OHLCV candles
- [ ] Task 51: CoinGecko historical BTC fetcher
- [ ] Task 52: Yahoo Finance fetcher for SPX/SPY/VIX/DXY
- [ ] Task 53: FRED macro series fetcher
- [ ] Task 54: caching layer with 15 s TTL and rate limits

### Sentiment & Correlation

- [ ] Task 41: collect Crypto-Twitter sentiment data
- [ ] Task 42: compute short-term sentiment index
- [ ] Task 43: stream liquidations and open interest
- [ ] Task 44: merge liquidation and open-interest data
- [ ] Task 45: calculate rolling BTC/SPX correlation
- [ ] Task 46: chart correlation over time

### Macro Indicators

- [ ] Task 47: pull Fed funds rate schedule
- [ ] Task 48: integrate economic-event calendar feed

### Alerts & Notifications

- [ ] Task 55: show toast alerts on key events
- [ ] Task 56: configurable alert panel
- [ ] Task 57: quick-entry trade journal
- [ ] Task 58: annotate historical events on the chart

### UI Enhancements

- [ ] Task 67: key-level proximity indicators
- [ ] Task 68: customizable TradingView widget
- [ ] Task 69: one-click indicator toggles

### Performance & Monitoring

- [ ] Task 70: real-time strategy-performance tracker
- [ ] Task 71: monitor data latency and system load

### Testing & Validation

- [ ] Task 59: unit tests for each indicator
- [ ] Task 60: validate indicators on historical data
- [ ] Task 61: real-time backtester with metrics

### Documentation & Configuration

- [ ] Task 62: generate API reference documentation
- [ ] Task 63: create user guide
- [ ] Task 64: write developer setup guide
- [ ] Task 65: document configuration thresholds
- [ ] Task 66: describe each configuration parameter

---

## Definition of Done

- Priority widgets and indicators are functional and visible.
- Test, lint and backtest logs are saved under `/logs`.
- Each completed task is auto-committed with a passing build.
- `context.snapshot.md` and `memory.md` reflect the new status.
- Git log mirrors TASKS.md history for quick recovery.
- Follow-up tasks mention the commit hash that introduced related changes.
