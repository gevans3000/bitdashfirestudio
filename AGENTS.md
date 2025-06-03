# AGENTS.md – Codex Automation Charter
Codex must load PERSISTENT_MEMORY_GUIDE.md before any task cycle.
**Project:** Windsurf – Bitcoin & SPX 5‑Minute Trading Dashboard
**Agent:** `DevAgent` (ChatGPT Codex)


This charter is optimized around **Git-based memory**. Every commit and
summary becomes part of the agents long-term knowledge. Keep the task queue,
memory files and commit history aligned so Codex can resume work even after a
context reset.

Codex operates through a lightweight **harness** that reads `task_queue.json`,
runs lint, test and backtest commands, then commits the resulting changes. Each
commit acts as a memory checkpoint so the agent can safely resume even after the
workspace resets.

> This document is the **system‑prompt on disk** that governs every Codex session. Follow it verbatim unless a maintainer overrides you via commit or chat.

## Roles & Responsibilities

- **Planner** – reads `task_queue.json` to prioritize and split work.
- **Coder** – implements features and fixes according to each task.
- **Tester** – runs lint, test and backtest commands, reporting failures.
- **Reviewer** – checks commit quality and ensures guidelines are met.

### DocAgent
- Responsible only for `context.snapshot.md`, `memory.log` and related docs.
- Must read `PERSISTENT_MEMORY_GUIDE.md` first, then follow the
  [Manual Kick-off Prompt](PERSISTENT_MEMORY_GUIDE.md#5--manual-kick-off-prompt-for-chatgpt-codex-ui).
- Operates in four phases: analysis, consolidation, implementation and commit.

This agent safeguards the persistent-memory system. It never edits application code and focuses on one memory task per session—archiving old snapshots, appending new entries or updating memory documentation. Each commit follows the mem-ID workflow outlined in the guide.

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
   b. Ensure package scripts `lint`, `test`, `backtest` run.
   c. Commit as `chore(bootstrap): automation rules` with a 333‑token summary.
   d. Append commit details to `memory.log` so the Git log mirrors persistent memory.
2. **Task Commit**
   a. Load `task_queue.json` and `TASKS.md`, choosing the first entry with `status: "pending"`.
   b. Implement **only** that task.
   c. Run `npm ci` if `node_modules` are missing, then `npm run lint && npm run test && npm run backtest`.
   d. Commit using **Conventional Commits** (`feat|fix(scope): …`).
   e. Body = 333‑token summary → part A “What I did”, part B “What’s next”.
   f. Append the same summary with metadata to `memory.log`.
   g. Run `npm run commitlog` to snapshot the latest Git history.
   h. Mark the task `done` in `task_queue.json` and check the box in `TASKS.md`.
   i. Rebase → merge → delete branch.
3. **HALT** – await next prompt.

**Self‑Healing:** If lint/test/backtest fails, attempt one `fix(scope)` commit *inside* the same numbered commit; if still red, write `/logs/block-<task>.txt` and stop.

---

## 2 · Memory Files

| File                  | Purpose                                               |
| --------------------- | ----------------------------------------------------- |
| `context.snapshot.md` | Live chronological memory log |
| `memory.log`          | Append-only history of commit summaries and hashes |
| Git history           | Primary record of changes, diffs and context |
| `task_queue.json`     | Machine-readable list of tasks with status |
| `/logs/*.txt`         | Fail‑logs, backtest output, debug notes               |

Codex must **read `memory.log` and recent commit messages** on each new session to rebuild context. The `logs/commit.log` file mirrors the Git history for quick lookup.
Run `npm run commitlog` after each commit to keep `logs/commit.log` current.

**Memory entry example**

```markdown
<hash> | Task <id> | <summary> | <files> | <timestamp>
```

Use this single-line format inside `memory.log` so the history remains easy to parse.

---

## 3 · Commit Format

```text
<type>(<scope>): <subject>

<333‑token summary>

BREAKING CHANGE: <optional>
Closes: TASKS.md #<line‑no>
```

Commit subjects begin with `Task <id>:` to link history with `TASKS.md`.

Every commit message doubles as persistent memory. Append the summary, commit hash and changed files to `memory.log` so agents can recall which code was touched. Reference these hashes in future tasks to maintain continuity.
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
| `npm run commitlog` | Update `logs/commit.log` |
| `npm run auto` | Process tasks via AutoTaskRunner |
| `npm run bootstrap` | Install deps then lint, test and backtest |

Run `npm ci` once when the environment starts (or `npm run dev-deps` if offline). `bash scripts/check-env.sh` verifies that `next`, `jest` and `ts-node` are available. The helper `scripts/try-cmd.js` is used by lint, test and backtest commands to skip missing binaries so automation never blocks.

---

## 8 · Definition of Done

* Task checkbox ✅ in `TASKS.md`
* Tests & lint pass
* `memory.log` updated with commit hash and summary
* Commit merged to `main`
* `task_queue.json` and `TASKS.md` in sync
* No unresolved errors or conflicts

---

## 9 · Commit-Based Memory Workflow

1. **Pre-Session** – run `npm run dev-deps` if `node_modules` is missing, then read `memory.log` and recent commits.
2. **After Commit** – append the 333‑token summary to `memory.log`, run `npm run commitlog` and continue with `npm run auto` when applicable.
3. **Sync Tasks** – update `task_queue.json` and check the box in `TASKS.md`.
4. **Reference History** – use commit hashes from `memory.log` when describing follow-up tasks.

> End of AGENTS.md – obey without deviation.
