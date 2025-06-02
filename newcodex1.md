# Autonomous Software Development with ChatGPT Codex and Git-Based Memory

## Introduction

ChatGPT’s **Codex mode** refers to an AI coding agent integrated into ChatGPT (powered by the `codex-1` model) that can autonomously perform software development tasks. Unlike passive code assistants, Codex can actively write code, debug, run tests, and even make version-control commits based on natural language prompts?38†L145-L153??38†L161-L169?. In a local environment (e.g. a developer’s machine with Python or Node.js), we can harness this capability to create an **autonomous coding agent** that iteratively tackles a list of tasks. The key is to maintain **persistent memory** across interactions – using a Git repository and designated files to store context – so the agent remembers past actions and can pick up long-running tasks where it left off. This report explores how to design such a system, focusing on: (1) guiding Codex with a persistent *task queue*, (2) a modular file structure for agent roles and memory, (3) a control loop (harness) for continuous execution, (4) robustness over long sessions and version-control challenges, (5) limitations of ChatGPT Codex mode and mitigations, and (6) insights from existing autonomous dev agents.

## Iterative Task Execution via a Persistent Task Queue

**Task Queue Mechanism:** We maintain a JSON file (e.g. `task_queue.json`) listing tasks the agent should perform. Each task might include a description, priority, status, and other metadata. For example, it could be an array of objects like:

```json
[
  { "id": 1, "description": "Implement user login API", "status": "pending" },
  { "id": 2, "description": "Fix failing authentication test", "status": "pending" }
]
```

Codex can be directed to **read from this persistent task queue**, pick the highest-priority or next task, and work on it until completion. In practice, the agent harness (described later) would load this JSON and include the next task’s description in the prompt to Codex. The agent then **translates the natural language task into code changes** autonomously?38†L145-L153?. Once a task is done, the queue file can be updated (marking it “done” or removing it) to reflect completion, and the agent moves on to the next task in the list.

**Autonomous Iteration:** For each task, the Codex agent will typically perform a sequence of steps: *understand the requirement, locate relevant code*, make edits, run tests, and iterate if needed. OpenAI’s Codex is capable of iteratively refining its output until tests pass or the goal is met?38†L151-L159??12†L590-L594?. For example, if the task is “Write unit tests for `utils/date.ts`”, Codex will generate test code, execute it, and **keep fixing any failures until all tests pass**?12†L590-L594?. Similarly, for a bug fix task, the agent can identify the faulty code, apply a patch, then run the project’s test suite to verify the fix?38†L153-L160?. This loop continues without human intervention in Codex’s autonomous mode.

?18†embed\_image? *Example interface (OpenAI Codex preview) showing a list of tasks and their outcomes. Each task (e.g. scanning for vulnerabilities, converting components to lazy loading, adding CI workflows) runs in an isolated sandbox with the repository. Completed tasks show lines of code added/removed (green/red) and statuses like “Merged” or “Open,” indicating integration progress.*

**Performing Code Edits and Commits:** When Codex works on a task, it can directly edit files in the repository (in a controlled sandbox or local working directory). In a local harness, we would allow the agent to output the code changes – typically as diffs or full file contents – which the harness applies to the actual files. After making changes, the agent (or harness) should commit them to Git with an appropriate message. In fact, tools like OpenAI’s Codex CLI and others already demonstrate this behavior: *“Codex rewrites the code, runs `npm test`, and shows the diff”* as part of completing a task?12†L586-L594?. Similarly, the open-source tool **Aider** (an AI pair-programmer CLI) *“automatically commits changes with sensible commit messages”* after applying GPT-driven code edits?44†L333-L337?. The commit serves as a checkpoint and also as a record in the Git history, which doubles as a memory log of what the agent has done.

**Running Tests and Validation:** A critical part of each task iteration is validating that the changes work. The Codex agent can execute test commands or run the code to observe outputs?38†L161-L169?. In the local setup, the harness can automatically run the project’s test suite (for instance, `npm test` or `pytest`) after the agent makes changes. If tests fail or new errors arise, those failure logs can be fed back into Codex on the next iteration, allowing it to debug and fix the issue (this is akin to giving it feedback). Codex is explicitly designed to incorporate test outcomes and try again until tests pass?38†L153-L160?. For example, **Aider**’s workflow is to *“lint and test your code every time \[it] makes changes,” and it can fix problems detected by linters and tests*?44†L353-L357?. This ensures the agent doesn’t blindly move to the next task without achieving a correct solution for the current one. Once validation passes (green tests), the task is considered done, and the agent commits the final changes.

## File Structure for Agents, Memory, and Tasks

To manage the agent’s behavior and long-term context, we use a **modular file structure** in the project repository:

* **`AGENTS.md`: Agent Roles & Instructions.** This markdown file defines the roles, rules, or special instructions for the Codex agent(s). The Codex CLI supports such project-specific docs – *“Codex can be guided by AGENTS.md files placed within your repository”*?38†L177-L184?. In practice, `AGENTS.md` can include high-level guidelines like architecture notes, coding style conventions, and tool usage instructions (e.g. how to run tests or build the project). It can also define multiple “agents” or sub-roles if we design a multi-agent system. For example, we might outline roles such as:

  ```markdown
  # AGENTS.md  
  ## Roles  
  - **Planner**: analyzes the task queue and decides on task priorities or subtasks.  
  - **Coder**: writes and modifies code to implement features or fixes.  
  - **Tester**: runs tests and verifies the code, suggests fixes for any failures.  
  - **Reviewer**: reviews changes and ensures coding standards are met before commit.  

  ## Guidelines  
  - Use `npm test` to run tests; all tests must pass before committing.  
  - Follow the project’s coding style and lint rules (see `.eslintrc`).  
  - Document any new functions in code comments.  
  ```

  Such a file can be ingested by the Codex agent at runtime – in fact, Codex merges instructions from global and project-specific `AGENTS.md` files automatically?12†L544-L552?. By defining roles, we make the system extensible; for instance, we could later add a **“Security Auditor”** agent role to scan for vulnerabilities as a task. Even if we use a single agent instance (single prompt) rather than multiple concurrent agents, `AGENTS.md` still helps by providing a persistent system prompt with project-specific context (like telling Codex which testing command to run, or domain-specific guidelines). This reduces the need to repeat such instructions in every prompt, effectively acting as part of the agent’s memory or persona.

* **`memory.md`: Persistent Memory Log.** This markdown file serves as an append-only journal of the agent’s progress and important information to remember. Because ChatGPT/Codex has a finite context window (even if codex-1 supports a large context up to \~192k tokens)?38†L185-L193?, it cannot indefinitely remember everything from earlier in a session. The `memory.md` file acts as an external long-term memory: after each task or significant event, we append a summary, code diff, or key observations here. For example, after completing a task, we might log:

  ```markdown
  ## Task 1 (Implement login API) – Completed  
  - Created `auth/login.js` with login handler.  
  - Updated `routes.js` to include login route.  
  - All new unit tests in `auth.test.js` passed.  
  - Commit: `abc1234` ("Add login API feature")  

  ## Task 2 (Fix auth test) – Completed  
  - Resolved null pointer bug in `auth/login.js` (added null check).  
  - Test `auth.test.js` now passes.  
  - Commit: `def5678` ("Fix null bug in login API")  
  ```

  If the agent’s session is interrupted or the context is lost, the harness can reload `memory.md` and include recent entries in the next prompt to remind Codex what has been done. The memory file can also store *diffs* of changes or error traces if needed (though diffs can be large, so summarizing is often better). The idea is similar to how one might use a scratchpad or notes in human collaborative coding – it persistently records decisions and outcomes. In more advanced setups, this could be supplemented by a vector database of embeddings for semantic lookup of past events, but a simple markdown log is a human-readable and version-controlled solution. Notably, the Git commit history itself is a form of persistent memory; commit messages and diffs are stored in the repo. Our `memory.md` can reference commit hashes or messages, effectively linking to the detailed diffs in Git when needed. This approach ensures *no important context is forgotten* even if the agent’s short-term memory resets.

* **`task_queue.json`: Dynamic Task List.** This JSON file contains the queue
