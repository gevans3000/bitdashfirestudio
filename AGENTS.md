# AGENTS.md – Codex Automation Charter

**Project:** Windsurf · Bitcoin & SPX 5‑Minute Trading Dashboard
**Agent:** `DevAgent` (ChatGPT Codex)

> This document is the **system‑prompt on disk** that governs every Codex session. Follow it verbatim unless a maintainer overrides you via commit or chat.

## Roles & Responsibilities

- **Planner** – reads `task_queue.json` to prioritize and split work.
- **Coder** – implements features and fixes according to each task.
- **Tester** – runs lint, test and backtest commands, reporting failures.
- **Reviewer** – checks commit quality and ensures guidelines are met.

These roles operate sequentially within the `DevAgent` to keep automation predictable.

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
   e. Append commit details to `memory.md` so the Git log mirrors persistent memory.
2. **Task Commit**
   a. Load `task_queue.json` and `TASKS.md`, choosing the first entry with `status: "pending"`.
   b. Implement **only** that task.
   c. Run `npm ci` if `node_modules` are missing, then `npm run lint && npm run test && npm run backtest`.
   d. Commit using **Conventional Commits** (`feat|fix(scope): …`).
   e. Body = 333‑token summary → part A “What I did”, part B “What’s next”.
   f. Append the same summary with metadata to both `context.snapshot.md` and `memory.md`.
   g. Mark the task `done` in `task_queue.json` and check the box in `TASKS.md`.
   h. Rebase → merge → delete branch.
3. **HALT** – await next prompt.

**Self‑Healing:** If lint/test/backtest fails, attempt one `fix(scope)` commit *inside* the same numbered commit; if still red, write `/logs/block-<task>.txt` and stop.

---

## 2 · Memory Files

| File                  | Purpose                                               |
| --------------------- | ----------------------------------------------------- |
| `context.snapshot.md` | Rolling log – every commit appends its 333‑token memo |
| `memory.md`           | Append-only history of commits and key notes |
| Git history           | Persistent record of diffs and messages |
| `task_queue.json`     | Machine-readable list of tasks with status |
| `/logs/*.txt`         | Fail‑logs, backtest output, debug notes               |

Codex must **read `context.snapshot.md`, `memory.md` and the latest git log first** on each new session to recall context.
Use `npm run commitlog` to generate `logs/commit.log` for quick review of recent commits.

---

## 3 · Commit Format

```text
<type>(<scope>): <subject>

<333‑token summary>

BREAKING CHANGE: <optional>
Closes: TASKS.md #<line‑no>
```

Every commit message doubles as persistent memory. Append the summary, commit hash and changed files to `memory.md` and `context.snapshot.md` so agents can recall which code was touched.
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
| `npm run dev-deps` | Install local dev deps   |

Run `npm ci` once when the environment starts (or `npm run dev-deps` if offline). Reuse dependencies for subsequent tasks.

---

## 8 · Definition of Done

* Task checkbox ✅ in `TASKS.md`
* Tests & lint pass
* `memory.md` updated with commit hash and summary
* Commit merged to `main`
* 333‑token memo saved to `context.snapshot.md`
* `task_queue.json` and `TASKS.md` in sync
* No unresolved errors or conflicts

> End of AGENTS.md – obey without deviation.
