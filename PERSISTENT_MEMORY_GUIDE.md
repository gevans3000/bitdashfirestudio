# PERSISTENT\_MEMORY\_GUIDE.md – Codex Memory‑Maintenance Rules

> **Mission:** Maintain the repository’s persistent memory **only**.  Codex may touch *documentation and agent‑instruction* files but **must never modify application code** (TypeScript, React, configs, builds).  All activity revolves around appending or archiving memory blocks and keeping the docs that govern that workflow up‑to‑date.

---

## 1 · Files Codex May Change

| File / Directory             | Purpose                             | Allowed Actions                                                                           |
| ---------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `context.snapshot.md`        | Live chronological memory log       | **Append‑only** new blocks                                                                |
| `memory.log`                 | Commit summary history              | Append commit info after each commit |
| `archive/`                   | Historical snapshots (month‑rolled) | Create new archive files, move old blocks                                                 |
| `PERSISTENT_MEMORY_GUIDE.md` | This rule set                       | Amend wording or policy *only* to clarify memory workflow                                 |
| `AGENTS.md`                  | Agent charter                       | Update **memory‑related sections** or references to snapshot workflow. No other sections. |
| `TASKS.md`                   | Task queue                          | Add / reorder / clarify *documentation or memory* tasks. **Do NOT add code tasks.**       |
| `/logs/memory‑*.txt`         | Diagnostic logs on failure          | Auto‑generate                                                                             |

> **Forbidden:** Editing any `.ts`, `.tsx`, `.js`, runtime `.json` (except archives), `/app`, `/lib`, build files, or config files unrelated to memory.  If uncertain, log an error and stop.

---

## 2 · Memory Block Schema (append to `context.snapshot.md`)

```md
### 2025‑06‑05 14:12 UTC | mem‑001
- **Commit SHA:** abc123f
- **Summary:** <≤333‑token description of change>
- **Next Goal:** <next memory or doc objective>
```

**Rules**

* Keep each block ≤ 333 tokens.
* UTC timestamp format `YYYY‑MM‑DD HH:MM UTC`.
* Monotonic `mem‑###` counter. The `mem‑ID` value is global and keeps increasing
  even when snapshots are archived.
* Never alter prior blocks; use append‑only semantics.

Scripts such as `scripts/append-memory.sh` read the last block and automatically
increment the `mem-ID` counter when appending new entries. Use these helpers to
keep the numbering consistent.

---

## 3 · Commit Policy

* **One memory/document task → one commit.**
* Allowed commit types: `docs(memory)` or `chore(memory)`.
* Subject line ≤ 50 chars and must include `mem‑ID`.
* Commit body **must equal** the memory block being appended (plus optional diagnostics below it).
* For changes in `AGENTS.md` or `TASKS.md`, mention them briefly in the summary.

Example commit message:

```text
docs(memory): mem‑031 archive May‑2025 snapshot

### 2025‑06‑05 14:12 UTC | mem‑031
- Commit SHA: abc1234
- Summary: Archived May‑2025 snapshot (>5 000 lines).
- Next Goal: continue snapshot appends for June.
```

---

## 4 · Allowed Operations

1. **Append Snapshot** – default action on each run.
2. **Archive Older Snapshots** – trigger when `context.snapshot.md` > 5 000 lines **or** calendar month changes:

   * Move all but the last block to `archive/context_snapshot_<YYYY‑MM>.md`.
   * Log an archive memory block.
3. **Update Docs** – if snapshot format, counter, or archive policy needs change, update this guide (`PERSISTENT_MEMORY_GUIDE.md`) **and** the relevant memory sections of `AGENTS.md` and `TASKS.md`.
4. **Diagnostics** – on any append/archive error, write `/logs/memory‑error‑<timestamp>.txt`.

No other edits are allowed.

---


## 5 · Manual Kick-off Prompt (for ChatGPT Codex UI)

```text
You are **Codex DocAgent**, an AI assistant focused solely on the repository's persistent-memory system. Read `PERSISTENT_MEMORY_GUIDE.md` first and never modify application code.

Mission: streamline and document `context.snapshot.md` through disciplined updates.

Follow this four-phase cycle each session:
1. **Ingestion & Current State Analysis** – load this guide plus `context.snapshot.md`, `AGENTS.md` and `TASKS.md`.
2. **Consolidation Proposal** – choose one memory task (archive, append or doc update) based on the current state.
3. **Implementation & Verification** – perform the change using repo scripts, run lint and ensure only allowed files changed.
4. **Commit & Report** – commit with `docs(memory): mem-ID <subject>` where the body equals the memory block, then push to `main` and stop.
```

### Checklist for Codex

* [ ] Read last snapshot and line count.
* [ ] Decide append or archive using the four-phase flow.
* [ ] Perform memory/doc updates only—no app code.
* [ ] Run `npm run lint` if available.
* [ ] Commit with mem-ID block and push to `main`.
* [ ] Verify only allowed files changed.

> **Remember:** Never alter application code.
## 6 · append-memory.sh

Run `scripts/append-memory.sh "Summary" "Next goal"` to append a new memory block.
The script reads only the last 20 lines of `context.snapshot.md` to find the most
recent `mem-###` ID, increments it, and writes the block with the current UTC
timestamp and short commit hash. The data is written to a temporary file, flushed
to disk with `fsync`, and then atomically moved into place to avoid corruption.
If the append fails, a log is written to `logs/memory-error-<timestamp>.txt`.
