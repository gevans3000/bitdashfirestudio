# INSTRUCTIONS.md

This repository uses a Codex developer agent. The notes below summarize the
workflow described in `codesetuptolearnfrom.md`.

## Quick Start

1. Read `AGENTS.md` for project rules and open `TASKS.md` to locate the next
   unchecked task. Review `context.snapshot.md` for the latest summary.
2. Implement only that task with minimal changes.
3. Run `npm run lint` and `npm run test` if available.
4. Mark the task as `[x]` in `TASKS.md`.
5. Commit with `Task <number>:` followed by a 333-token body describing what you
   did and what's next. The same text updates `context.snapshot.md`.
6. If lint or tests fail, fix the issue and recommit.
7. Repeat until all tasks are done or more input is needed.

## Commit Example

```text
Task 3: Add agent interface
- created `types/agent.ts` with AgentMessage schema
- enables structured communication between agents
```

## Additional Notes

- Use `.env.local.example` as a template for environment variables.
- The root `signals.json` may store flags such as `last_task_completed` or
  `error_flag`.
- Keep commit subjects around 50 characters and wrap body lines near 72.
- `context.snapshot.md` records a 333-token summary after each commit with metadata for the next objective.
- If a task fails, enter a correction loop, fix the problem and update the snapshot with a new summary.
- Pause and ask for clarification if a task is unclear.
