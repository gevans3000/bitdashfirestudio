# Memory Log

This file records a running history of completed tasks and key decisions. After
every commit append a short entry using the format below.

```
<hash> | Task <id> | <summary> | <files> | <timestamp>
```

Example:

```markdown
## Task 1 (Implement login API)  Completed
- Created `auth/login.js` with login handler.
- Updated `routes.js` to include login route.
- All new unit tests in `auth.test.js` passed.
- Commit: `abc1234`
```

Keep each summary under 333 tokens so it fits within Codex prompts. Append one line per commit and run `npm run commitlog` so `logs/commit.log` mirrors this file. Git history and `memory.md` combined let the agent rebuild context when sessions restart.
