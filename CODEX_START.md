# CODEX_START: ChatGPT Codex Setup & Guidelines

This document provides a comprehensive instruction set for running OpenAI Codex entirely inside the ChatGPT UI with a focus on efficiency and reliability. The guidelines below ensure Codex operates with minimal overhead and follows a strict workflow. These instructions complement the rules in `AGENTS.md` (the project's AI guidance file) and serve as hard boundaries for Codex's behavior. By adhering to this setup, Codex will only start when prompted by the user, execute tasks one at a time, and use the Git repository itself to persist memory and state between tasks.

## Codex Kickoff Prompt

To manually launch the Codex automation in ChatGPT, copy and paste the following prompt in the ChatGPT Codex interface. This kickoff prompt initializes Codex with all necessary constraints and should be used whenever you want to begin or resume the automation:

```
You are an AI coding assistant (Codex) operating inside the ChatGPT UI, focused on completing tasks from this repository. You **must** follow the project's AGENTS.md guidelines (coding standards, testing requirements, etc.) and the instructions below as absolute rules:

- **Manual Start Only**: Do not act until explicitly instructed. Begin working **only when this prompt is given**. (No autonomous actions should run at startup.)
- **Task Queue Usage**: Refer to 'TASKS.md' for your to-do list. Always pick the **first unchecked** '[]' task in 'TASKS.md' as your current objective.
- **Minimal Compute Footprint**: Work efficiently. Avoid any form of polling or waiting loops. Do **not** fetch live data or call external APIs unless a task explicitly requires it. Refrain from unnecessary rebuilds or re-running tests repeatedly. Perform only the actions needed to complete the active task.
- **One Commit per Task**: Treat each task as a standalone unit of work. Complete the task and produce exactly **one git commit** containing the changes for that task (the only exception is an initial bootstrap setup, if needed). Do **not** batch multiple tasks into one commit.
- **Git Workflow**: Work on a single branch (typically 'main') and integrate changes cleanly. **Do not create new branches** for tasks. Before committing, if the 'main' branch has new updates (e.g., from other parallel tasks or collaborators), **rebase or pull** the latest 'main' into your work to incorporate changes and avoid conflicts. Ensure the working directory is clean before and after committing. **Never amend** past commits - each commit should be final. Use descriptive commit messages that reference the task.
- **Persistent Memory via Commits**: After completing a task, update the file 'context.snapshot.md' with a **memory block** summarizing what was done. Include the current timestamp, the task ID or name, the commit SHA of your new commit, and a brief note of the **next goal** or upcoming task. Keep the summary to roughly 333 tokens or fewer. Append this entry to 'context.snapshot.md' and include it in the commit for the completed task. This way, the repository itself retains your "memory" of prior work.
- **Task Completion Cycle**: Mark the task as done in 'TASKS.md' (e.g., change '[]' to '[x]') as part of your commit. After committing, look at 'TASKS.md' again. If there is another unchecked task, proceed to the next one following these same rules. Continue this cycle until all tasks are checked off. If no tasks remain, stop and await further instructions from the user.
- **No External Processes**: Stay within the provided tools and environment. Do not launch external scripts, start servers, or use third-party CLI programs unless the task explicitly allows it and it's necessary. Any shell commands executed should be directly related to fulfilling the current task (for example, running build or test commands if required by the project's workflow).
- **Error Handling**: If something goes wrong (failing tests, merge conflicts, etc.), address it as part of the current task. Ensure that by the end of the task, all tests pass and the project is in a good state per 'AGENTS.md' guidelines. Only mark the task complete (and commit) once the acceptance criteria are met.
- **Context Management**: Use 'context.snapshot.md' and other project docs to recall prior information instead of relying on conversation memory. At the start of each new task, review 'context.snapshot.md' to remember previous decisions and context. Keep your solutions self-contained and documented so future tasks can understand the project state from the repository.
- **Obey Instructions**: Adhere strictly to these rules and the 'AGENTS.md' constraints. Do not attempt actions that violate these guidelines. If a task request conflicts with these rules or seems unsafe, stop and seek clarification rather than proceeding.

Now, begin by confirming that 'AGENTS.md' is loaded and acknowledging the first pending task from 'TASKS.md'. Then proceed with the plan for that task according to the above rules.
```

### How to use this prompt
In ChatGPT's Codex mode, make sure your repository is loaded (and up-to-date) in the sidebar. Paste the above prompt into the chat and hit "Run" (or the equivalent Code execution command). Codex will initialize and start executing the first task. It will then continue to automatically carry out tasks one by one, committing after each, until the task list is completed or it's stopped. All its actions will stay within the ChatGPT UI environment - there's no need to switch to a terminal or GitHub interface.

## context.snapshot.md Memory Block Template

After each commit, Codex writes a memory snapshot to the `context.snapshot.md` file. This serves as persistent memory, allowing the agent to recall past context even if the chat session is reset or the context window is limited. Each entry is appended as a new section in `context.snapshot.md`. Here is an example template for a memory block (with placeholder content for illustration):

```
# Task 3 - Completed 2025-06-03 12:34:56 UTC (Commit abc1234)

- **Task:** Implement user login feature (Task 3)
- **Commit SHA:** abc1234
- **Timestamp:** 2025-06-03T12:34:56Z
- **Next Goal:** Set up session persistence for logged-in users
- **Memory Summary:** Implemented the user login UI and backend logic. Added tests for the login workflow, all of which are passing. The application now supports user authentication. Next, the plan is to handle session persistence so that users remain logged in across sessions.
```

In this template:
- The heading includes the task number or name, completion time, and commit identifier.
- Metadata lines (Task, Commit SHA, Timestamp, Next Goal) give structured info about the context of this commit.
- The Memory Summary provides a concise description of what was done and important details or decisions. This should be written in past tense, focusing on outcomes (e.g., "Added X," "Configured Y," "Fixed Z") and any context needed for upcoming tasks. Aim to keep this summary under ~333 tokens so it's brief but informative.

When Codex starts a new task, it should read `context.snapshot.md` to refresh its context. By following this format, each memory block acts as a 333-token chunk of persistent memory, and the file will chronologically document the project's evolution. (It can be helpful to initialize `context.snapshot.md` with a header explaining its purpose, and possibly a first entry if any pre-existing context is needed.)

## Minimal Required Project Files

To use Codex effectively in this setup, ensure your repository contains the following minimal set of files (in addition to your actual codebase):

- **AGENTS.md** - This file contains project-specific guidelines and rules for the AI agent. It might include coding style preferences, testing requirements, architectural conventions, and any constraints that Codex must obey. The Codex system will automatically load and merge this file as part of its instruction hierarchy, so it serves as an always-on reference for the agent. Make sure it's placed in the repo root (and in relevant subdirectories if using a hierarchical structure) so that Codex can find it.

- **TASKS.md** - A Markdown checklist of tasks or feature requests that Codex will work on. Each task should be an item in a list, preferably with a checkbox:
  - Incomplete tasks should start with `[ ]` and a short descriptive title (and optionally a brief description or acceptance criteria).
  - Example: `[ ] Build user login page`
  - Completed tasks will be marked `[x]` (Codex will check them off as it finishes each one).

Codex reads this file to determine what to do next. It always picks the first unchecked task as the next unit of work. Maintaining a clear, ordered task list helps Codex proceed in a logical sequence. If no tasks are left unchecked, Codex will conclude its run. (It's a good idea to prioritize and order tasks such that dependencies are respected.)



context.snapshot.md - The persistent memory log described above. This can start as an empty file or contain a brief initial context description if necessary (for example, a summary of the project's starting state or any pre-existing code context). After each commit, Codex appends a new entry here. Having this file ensures that if the conversation context is lost or the agent is restarted, it can regain knowledge of what has been done by reading this log.



CODEX_START.md - (Optional but recommended) This file (the one you are reading now) contains the kickoff prompt and guidelines for using Codex. While not strictly required for the agent to function, including it in your repo is helpful for documentation. It lets other collaborators know how to start the Codex agent and what rules it follows. It can also be a reference if you need to re-paste the prompt after a long break or for a new session.

Initial setup

Ensure your repository is a Git repo and has at least the above files in place before running Codex. If you are starting a brand new project, you might perform a one-time "bootstrap" commit that adds AGENTS.md, TASKS.md, context.snapshot.md, and any scaffolding code. (Codex can do this as a first task if instructed, but it's often easier to prepare a basic scaffold manually.) Once these are present, you can trigger Codex with the kickoff prompt. From that point, Codex will handle creating new code, modifying files, and updating the tasks and context as it works through the queue.

Tips for Avoiding Conflicts and High CPU Usage

Following the above procedure will naturally enforce good practices. Here are additional tips to ensure smooth operation, prevent excessive resource use, and avoid losing context:





Stay in Sync with main: If you or others are making changes to the repository concurrently, always update Codex's view of the repo before it commits. In practice, this means instructing Codex to do a git pull --rebase or otherwise fetch the latest main at the start of each task (the kickoff prompt already indicates this). OpenAI's guidelines for Codex emphasize using a single branch and not amending commits, which helps maintain a linear history and reduces merge issues. By rebasing onto the latest state when necessary, Codex can integrate its changes without triggering conflicts. This tip is especially important if running multiple Codex tasks in parallel or if a human collaborator may push changes between tasks.



One Task at a Time: Resist the temptation to have Codex multitask or handle several checklist items in one go. Keeping tasks atomic and one-per-commit means each change set is focused and easier to review or revert if needed. It also minimizes the chance of overlapping changes that could conflict or cause confusion. If a task is too large, consider breaking it into smaller sub-tasks in TASKS.md so that Codex can commit in increments.



Limit Resource-Heavy Operations: Codex should not run anything that consumes extensive CPU or memory for long periods unless absolutely required by the task. For example, avoid writing code that enters infinite or very large loops, and do not repeatedly rebuild the entire project or run full test suites unnecessarily. Ideally, leverage quick feedback tools (like linters or type-checkers) to catch obvious issues, and run heavy tests only once when the task is nearly complete or as specified by AGENTS.md. By reducing redundant computations, you keep the cloud sandbox efficient and avoid hitting usage limits.



No Background Daemons: Since Codex operates in an ephemeral cloud sandbox for each task, there's no benefit to launching persistent background processes. Starting a development server or watcher that runs indefinitely will just waste cycles (and likely be terminated by the sandbox). Instead, have Codex perform build/test commands that run to completion and then exit. Each task run should be self-contained. If the project needs a server (for example, to test an API endpoint), spin it up only for the duration of a test and then shut it down. This ensures the agent's run finishes promptly and resources are freed.



Memory Persistence: Always rely on context.snapshot.md to retain important info. Before working on a new task, Codex should read this file to load any summaries of prior work. This prevents context loss that can occur due to the limited chat history window. By summarizing each task's outcome in ~333 tokens, you ensure that even as the project grows, Codex can recall critical points from older tasks without re-reading all code or past chats. If you notice the snapshot file growing very large, you can occasionally prune or condense older entries (or have Codex do it) - but keep the essential details. The snapshot is effectively the agent's long-term memory.



Testing and Verification: To avoid regressions and repeated fixes (which waste tokens and time), encourage Codex (via AGENTS.md rules or task definitions) to run tests and linters after making changes. Codex should only mark a task as done when the code passes all checks. This way, each commit is a stable build. It prevents scenarios where a bug introduced in one task forces another unplanned task to fix, which could complicate the context. In short, fail fast within the task: if something is wrong, fix it before committing, rather than committing broken code.



Communication in Commits: Since commits double as memory, ensure commit messages and context.snapshot.md entries are clear. If a future task or developer looks back, they should quickly understand what was done. For example, a commit message like feat: add login page (Task 3) and a snapshot entry that describes the implementation and results will make it easier to pick up the thread later. Good documentation within commits reduces confusion and the need for the AI to re-discover context, thereby saving compute (no need for Codex to rediscover why something was done - it's recorded).



Avoiding Unintended Deletions: One observed risk with coding agents is accidental deletion or modification of files not related to the task (as noted by early users in the community). To mitigate this, tasks should be specific about which parts of the code to change. The AGENTS.md can include safeguards (like "Do not delete files unless the task explicitly requires it"). Codex should double-check that its file modifications are limited to the scope of the task at hand. This prevents wasted time restoring accidentally removed content and again conserves the compute effort for only productive work.

By following these tips and the structured workflow above, Codex will operate efficiently, safely, and predictably within the ChatGPT UI. The agent will only run when you prompt it, perform one task at a time, and persist its progress into the repo. This results in a low-overhead automation cycle: no unnecessary CPU burn, no context confusion, and minimal git conflicts.

In summary, this CODEX_START.md instruction set, together with your AGENTS.md, establishes a clear contract for the AI agent. It delineates what the agent can and cannot do. As long as Codex respects these rules (which the kickoff prompt ensures), you can confidently use it to accelerate development on your project without it going off-course. Happy coding with Codex!

References





GitHub - openai/codex: Lightweight coding agent that runs in your terminal



A Quick Look at ChatGPT Codex, an AI Coding Agent