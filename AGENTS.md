# AGENTS.md – Codex Automation Charter

**Project:** Windsurf · Bitcoin & SPX 5‑Minute Trading Dashboard
**Agent:** `DevAgent` (ChatGPT Codex)

> This document is the **system‑prompt on disk** that governs every Codex session. Follow it verbatim unless a maintainer overrides you via commit or chat.

---

## 0 · Hard Constraints

| Key              | Value / Rule                                |
| ---------------- | ------------------------------------------- |
| Language         | TypeScript 5 (strict)                       |
| Framework        | Next.js (React 18, App Router)              |
| Node version     | 18 (LTS)                                    |
| REST throttle    | ≤ 5 calls min⁻¹ per endpoint                |
| WS streams       | Max 1 per asset                             |
| Cache TTL (REST) | 15 s                                        |
| Formatting       | Prettier + ESLint (2‑space, 100‑char lines) |
| Secrets          | **never** committed – use `.env.local`      |
| History backfill | 90 days (for backtests)                     |

---

## 1 · Core Automation Loop

> **Exactly two commits per session, then stop.**
> If more tasks remain, a new session will restart the loop.

1. **Bootstrap Commit**
   a. Validate & patch this file (`AGENTS.md`) and helper files so automation rules exist.
   b. Create `context.snapshot.md` if missing.
   c. Ensure package scripts `lint`, `test`, `backtest` run.
   d. Commit as `chore(bootstrap): automation rules` with a 333‑token summary.
2. **Task Commit**
   a. Open `TASKS.md`, pick the first `[ ]` item.
   b. Implement **only** that task.
   c. Run `npm ci && npm run lint && npm run test && npm run backtest`.
   d. Commit using **Conventional Commits** (`feat|fix(scope): …`).
   e. Body = 333‑token summary → part A “What I did”, part B “What’s next”.
   f. Append same summary with metadata to `context.snapshot.md`.
   g. Rebase → merge → delete branch.
3. **HALT** – await next prompt.

**Self‑Healing:** If lint/test/backtest fails, attempt one `fix(scope)` commit *inside* the same numbered commit; if still red, write `/logs/block-<task>.txt` and stop.

---

## 2 · Memory Files

| File                  | Purpose                                               |
| --------------------- | ----------------------------------------------------- |
| `context.snapshot.md` | Rolling log – every commit appends its 333‑token memo |
| `/logs/*.txt`         | Fail‑logs, backtest output, debug notes               |

Codex must **read `context.snapshot.md` first** on each new session to recall context.

---

## 3 · Commit Format

```text
<type>(<scope>): <subject>

<333‑token summary>

BREAKING CHANGE: <optional>
Closes: TASKS.md #<line‑no>
```

*Types*: `feat`, `fix`, `chore`, `docs`, `test`.

---

## 4 · Directory Layout

```
/app            – Next.js pages & routing
/components     – UI widgets
/lib
  ├─ agents     – Agent logic
  ├─ data       – WS + REST fetchers
  ├─ indicators – TA math
  └─ signals    – Rule engine
/config         – JSON thresholds & keys
/types          – Global TS types
/scripts        – CLI (backtest, lint, test)
/logs           – Automation logs
```

---

## 5 · Agents & Messaging (`/types/agent.ts`)

```ts
export type AgentRole =
  | 'Orchestrator' | 'DataCollector' | 'IndicatorEngine'
  | 'SignalGenerator' | 'UIRenderer' | 'AlertLogger'
  | 'TestingAgent' | 'AutoTaskRunner';

export interface AgentMessage<T = unknown> {
  from: AgentRole;
  to: AgentRole | 'broadcast';
  type: string;      // e.g. "KLINE_5M" | "SIGNAL_BUY"
  payload: T;
  ts: number;        // epoch ms
}
```

---

## 6 · Trading Rules (5‑Minute BTC)

1. **EMA‑10 / EMA‑50 crossover**
2. **Bollinger + RSI extremities**
3. **Volume ≥ 1.5 × SMA‑20**
4. **15‑min cooldown**

*See `/config/signals.json` for thresholds.*

---

## 7 · Local Scripts

| Cmd                | Action                   |
| ------------------ | ------------------------ |
| `npm run dev`      | Dev server               |
| `npm run lint`     | ESLint + Prettier        |
| `npm run test`     | Jest unit tests          |
| `npm run backtest` | Historical strategy test |

Always start a session with `npm ci`.

---

## 8 · Definition of Done

* Task checkbox ✅ in `TASKS.md`
* Tests & lint pass
* Commit merged to `main`
* 333‑token memo saved to `context.snapshot.md`
* No unresolved errors or conflicts

> End of AGENTS.md – obey without deviation.
