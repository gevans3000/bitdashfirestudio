# INSTRUCTIONS.md

This repository uses a Codex developer agent. The notes below summarize the
workflow described in `codesetuptolearnfrom.md`.

## Quick Start

1. Read `AGENTS.md` for project rules and open `TASKS.md` to locate the next
   unchecked task.
2. Implement only that task with minimal changes.
3. Run `npm run lint` and `npm run test` if available.
4. Mark the task as `[x]` in `TASKS.md`.
5. Commit with a message starting `Task <number>:` and provide context in the
   body when helpful.
6. Repeat until all tasks are done or more input is needed.

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
- Pause and ask for clarification if a task is unclear.
