# AGENTS.md

**Windsurf — Bitcoin & SPX 5-Minute Trading Dashboard**

> A lightweight TypeScript/Next.js trading system emitting reliable BUY/SELL signals.
> Agents collaborate asynchronously via typed JSON messaging.

---

## 0. Global Constraints

| Key              | Value                                      |
| ---------------- | ------------------------------------------ |
| Language         | TypeScript 5 (strict mode)                 |
| REST call limits | ≤ 5 req/min/endpoint                       |
| Cache TTL        | 15 s (REST)                                |
| WebSockets       | Single stream per asset                    |
| Secrets          | `.env.local` only                          |
| Formatting       | Prettier, ESLint (2-space, 100-char lines) |
| Data history     | 90 days backfill (for backtests)           |
| Target assets    | BTC-USDT (Binance), SPY, ^GSPC (Yahoo)     |

---

## 1. Free Data Sources

| Source        | URL / Channel                                       | Data Type             |
| ------------- | --------------------------------------------------- | --------------------- |
| Binance WS    | `wss://stream.binance.com:9443/ws/btcusdt@kline_5m` | Real-time OHLCV 5m    |
| CoinGecko     | `/coins/bitcoin/market_chart`                       | Historical REST OHLCV |
| Yahoo Finance | `yfinance` / RapidAPI                               | SPY, ^GSPC, VIX, DXY  |
| alt.me F\&G   | `https://api.alternative.me/fng/`                   | Market sentiment      |
| FRED          | `https://fred.stlouisfed.org/`                      | 10-Y yield            |

---

## 2. Project Structure

```
/app            – Next.js pages & routing
/components     – React widgets
/lib
  ├─ agents     – Agent implementations
  ├─ data       – Fetching, caching logic
  ├─ indicators – Calculation functions
  └─ signals    – Signal generation logic
/config         – JSON configuration
/types          – Global type definitions
/scripts        – CLI scripts (backtest, lint, test)
/logs           – Automated test/backtest logs
```

---

## 3. Messaging Schema (`/types/agent.ts`)

```typescript
export interface AgentMessage<T = any> {
  from: AgentRole;
  to: AgentRole | 'broadcast';
  type: string;
  payload: T;
  ts: number;
}

export type AgentRole =
  | 'Orchestrator'
  | 'DataCollector'
  | 'IndicatorEngine'
  | 'SignalGenerator'
  | 'UIRenderer'
  | 'AlertLogger'
  | 'TestingAgent'
  | 'AutoTaskRunner';
```

---

## 4. Agent Directory

| Role                | Responsibilities                                                 | Input                       | Output            |
| ------------------- | ---------------------------------------------------------------- | --------------------------- | ----------------- |
| **Orchestrator**    | Manage agent lifecycles & error recovery                         | -                           | All messages      |
| **DataCollector**   | Fetch & normalize OHLCV, enforce caching & throttling            | None                        | `KLINE_5M`        |
| **IndicatorEngine** | Calculate EMA, RSI, Bollinger Bands, Volume averages             | `KLINE_5M`                  | `INDICATORS_5M`   |
| **SignalGenerator** | Apply trade rules to indicators                                  | `INDICATORS_5M`             | `SIGNAL_BUY/SELL` |
| **UIRenderer**      | Render UI widgets (React), update trading views                  | `INDICATORS_5M`, `SIGNAL_*` | None              |
| **AlertLogger**     | Log alerts to UI & persist signals locally                       | `SIGNAL_*`                  | None              |
| **TestingAgent**    | Run Jest tests or backtests based on mode | Repo state or manual trigger | Test/backtest report |
| **AutoTaskRunner**  | Automate task execution, lint/test/backtest, auto-commit results | `TASKS.md`                  | Automated commits |

---

## 5. Trading Rules

1. **EMA Crossover:**

   * BUY: EMA-10 crosses above EMA-50.
   * SELL: EMA-10 crosses below EMA-50.
2. **RSI & Bollinger Bounce:**

   * BUY: Price ≤ lower Bollinger & RSI < 30.
   * SELL: Price ≥ upper Bollinger & RSI > 70.
3. **Volume Check:**

   * Signals valid only if volume ≥ 1.5× volume SMA-20.
4. **Cooldown:**

   * 15-min minimum interval between identical signals.

Signal object:

```typescript
export interface TradeSignal {
  asset: 'BTC';
  interval: '5m';
  type: 'BUY' | 'SELL';
  reason: string;
  price: number;
  ts: number;
}
```

---

## 6. Commit Memory & Automation

* Use structured commits (Conventional Commits):

  ```
  feat(indicator): add RSI calculation (#42)

  Calculates RSI per project rules.
  ```
* AutoTaskRunner scans `TASKS.md`:

  * Executes tasks, runs tests & backtests.
  * Logs outcomes to `/logs`.
  * Commits referencing completed tasks.
* Codex uses commit history as structured memory.
* Always run `npm ci` once at session start before lint/test.
* Each commit body must contain **333 tokens**. Use two paragraphs:
  * `What I did` – summarize the changes.
  * `What's next` – forecast upcoming steps.
  * If short, pad with the word `context` until 333 tokens.
* `scripts/autoTaskRunner.js` automates the cycle:
  * Reads the next unchecked task.
  * Runs `npm run lint`, `npm run test`, and `npm run backtest`.
  * Logs outputs to `/logs` and sets `error_flag` on failure.
  * Commits with header `Task <number>` and pushes to `main` when tests pass.

---

## 7. Local Commands

| Command            | Purpose                  |
| ------------------ | ------------------------ |
| `npm run dev`      | Start development server |
| `npm run test`     | Run unit tests (Jest)    |
| `npm run backtest` | Execute backtesting      |
| `npm run lint`     | Format and lint          |

---

## 8. Configuration (`src/config/signals.json`)

Editable signal thresholds (hot-reloadable):

```json
{
  "emaFast": 10,
  "emaSlow": 50,
  "rsiPeriod": 14,
  "rsiBuy": 30,
  "rsiSell": 70,
  "bbPeriod": 20,
  "bbStdDev": 2,
  "volumeMult": 1.5,
  "signalCooldownMin": 15
}
```

---

## 9. Definition of Done

* BUY/SELL signals visible in UI within 1–2 s.
* Logs in `/logs` for test/backtest outcomes.
* Completed `TASKS.md` items auto-committed and verified.

---

> **Follow exactly as specified.**
> Commits automatically track and document changes; review `/logs` regularly.

---

## 10. Codex Workflow Reference

These additional notes are distilled from `codesetuptolearnfrom.md` to guide
the Codex developer agent.

### Task Cycle

1. Open `TASKS.md` and select the first unchecked item.
2. Implement only that single task with small, incremental edits.
3. Run `npm run lint` and `npm run test` when available.
4. Mark the task as `[x]` in `TASKS.md`.
5. Commit using `Task <number>:` followed by a short summary. Provide context in
   the body if needed.
6. Repeat until all tasks are complete or more input is required.

### Commit Guidelines

- One task per commit.
- Keep subject lines around 50 characters and wrap body text near 72
  characters.
- Mention key decisions or affected modules in the commit body.
- Never commit secrets; copy `.env.local.example` to `.env.local` locally.
- The root `signals.json` may store `last_task_completed` or `error_flag`
  for automation state between runs.

### Initialization Prompt

```
You are an AI Developer Agent working on this repository.
Open AGENTS.md and TASKS.md, execute the first unchecked task, mark it
complete, commit with "Task <number>:" and continue to the next task.
```

Following this workflow keeps contributions deterministic and lightweight.

Additional tips are available in `docs/CODEX_WORKFLOW.md`, including how to
keep the container alive and generate a commit history log with
`npm run commitlog`.
