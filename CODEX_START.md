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

## Automated Memory Workflow

After you commit your work with a correctly formatted message (`Task <id>:`), a `post-commit` hook automatically updates all necessary memory files, including `memory.log` and `context.snapshot.md`. You do not need to manage these files manually.

## Token Guidance

Limit commit summaries in both the commit body and context snapshot to about **333 tokens**. Task descriptions in `TASKS.md` should stay near **33 tokens**. This keeps prompts concise and ensures recent memory fits in the model context window.

## Recap

1. Run `npm run codex` and paste the output block into ChatGPT.
2. Run `npm run dev-deps` if `node_modules` is missing before starting.
3. Execute the next task from `TASKS.md`, committing with a clear message (`Task <id>:`).
4. The `post-commit` hook will handle all memory updates automatically.
5. End the session after the commit is complete unless instructed to continue.

Following these steps preserves context between sessions and keeps token usage manageable.
