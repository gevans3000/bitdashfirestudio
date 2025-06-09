# Codex Workflow Guide

This document distills the key points from `CODEX-INSTRUCTIONS.txt` for working with this repository using the Codex agent.

## Commit-Based Memory

- Each task in `TASKS.md` should be completed in a single commit.
- Prefix commit messages with `Task <number>:` followed by a short summary.
- Include a 333-token body that is appended to `memory.log`.
- Keep the subject line around 50 characters; wrap body lines near 72 characters.
- Commit history and `memory.log` act as long-term memory. Review them before starting a new session.
- Keep `task_queue.json` synchronized with `TASKS.md` so automation can resume accurately.
- Run `npm ci` once at the start of a session. Subsequent commits can reuse the installed `node_modules`.

Each session ends after a single commit unless instructions explicitly allow more work. Start a new session to continue with the next commit.

## Keeping the Workspace Alive

Codex runs in an ephemeral container. To avoid losing context:

1. Queue multiple subtasks in one card and keep the card open.
2. Avoid closing the task panel between commits.
3. Use a long-lived branch if working on a larger feature.
4. Optionally create a small keep-alive script (e.g., `touch KEEPALIVE`) to prevent idle shutdown.

### Recommended Prompt Pattern

```
We will complete Tasks X–Y in one session.
1. Run `npm ci` once.
2. Work through each task sequentially, committing after each.
Keep this workspace running until I say "close workspace".
```


## Quick Workflow Summary

- Run `npm ci` once at the start of each session.
- Review `memory.log` for the latest summary and next objective.
- Execute the next pending item from `task_queue.json` and update `TASKS.md`.
- After each commit `memory.log` is updated with metadata.
- When resuming later, view the tail of `memory.log` to review recent commits.
- Test and backtest outputs are saved to `logs/` for reference. If they fail, fix and recommit.
- Keep compute usage and code changes minimal—avoid superfluous refactors or heavy scripts.

