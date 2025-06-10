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

Codex must read these files at the start of every run to rebuild context. Commit messages themselves serve as persistent memory, so keep them descriptive and follow the Conventional Commits format.

## Token Guidance

Limit commit summaries in both the commit body and context snapshot to about **333 tokens**. Task descriptions in `TASKS.md` should stay near **33 tokens**. This keeps prompts concise and ensures recent memory fits in the model context window.

## Recap

1. Run `npm run codex && npm run auto` and paste the output block into ChatGPT.
2. If you receive a new ad-hoc request, add it to `TASKS.md` then run the same command again to print the refreshed context and continue.
3. Run `npm run dev-deps` if `node_modules` is missing before starting.
4. Confirm AGENTS.md, memory.log and context.snapshot.md are loaded.
5. Execute the next task from TASKS.md, committing with a clear message.
6. End the session after that single commit unless you are explicitly told to continue.
7. Append the commit info to memory.log and context.snapshot.md.

Following these steps preserves context between sessions and keeps token usage manageable.
