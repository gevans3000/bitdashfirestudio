# CODEX_START – Manual Kickoff Instructions

This repository uses a commit-based memory system so Codex can recall recent work. Read this file before starting any automation run.

## Codex Kickoff Prompt

To begin a session in ChatGPT Codex:

```text
You are DevAgent working on the BitDash Firestudio repo.
Load AGENTS.md for project rules, then review memory.log and context.snapshot.md to recall recent commits. Read TASKS.md to identify the next unchecked task.
Use around 333 tokens of recent commit summaries plus the 33‑token next task as context. Obey the automation loop from AGENTS.md and update memory files after each commit.
```

Paste that block into the first message when launching Codex. The `npm run codex` script prints the latest commit summaries and next task to make this easy.

## Persistent Memory Workflow

- **memory.log** – append one line per commit: `hash | Task <id> | summary | files | timestamp`.
- **context.snapshot.md** – add a new `mem-XXX` section summarizing the commit (333 tokens max) and the next goal.
- **logs/commit.log** – run `npm run commitlog` after committing so recent history is easy to load.

Codex must read these files at the start of every run to rebuild context. Commit messages themselves serve as persistent memory, so keep them descriptive and follow the Conventional Commits format.

## Token Guidance

Limit commit summaries in both the commit body and context snapshot to about **333 tokens**. Task descriptions in `TASKS.md` should stay near **33 tokens**. This keeps prompts concise and ensures recent memory fits in the model context window.

## Recap

1. Run `npm run codex` and paste the output block into ChatGPT.
2. Confirm AGENTS.md, memory.log and context.snapshot.md are loaded.
3. Execute the next task from TASKS.md, committing with a clear message.
4. Append the commit info to memory.log and context.snapshot.md, then run `npm run commitlog`.

Following these steps preserves context between sessions and keeps token usage manageable.
