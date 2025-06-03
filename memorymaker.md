# Persistent Memory for ChatGPT Codex using Git Commits and Task Files

Building a persistent memory mechanism for ChatGPT Codex involves feeding it context from your development history and future plans. By leveraging Git commit messages as a record of "what was just done" and a `TASKS.md` file as a roadmap of "what to do next," you can emulate continuity across coding sessions. This setup helps Codex recall recent changes and stay focused on upcoming goals, even though it doesn't natively remember past sessions. Below, we outline a detailed strategy, file structure, setup steps, examples, and considerations for implementing this in local repos or in tools like ChatGPT Pro and VS Code.

## Strategy Overview
The core idea is to inject recent context and next objectives into Codex's prompt every time you start or continue a coding session. This is done by:

- **Harvesting recent Git history**: Automatically gathering the last ~333 tokens (a few commit messages) from your repository's commit log to summarize recent changes.
- **Referencing the next goal**: Pulling in the next task (around 33 tokens) from a maintained `TASKS.md` file which lists project tasks or user stories.
- **Providing these as context**: Feeding both the commit summary and the next task to Codex with each query/command, so it "remembers" what it just accomplished and what's upcoming.

This commit-and-task context acts as a surrogate short-term memory. It ensures Codex is aware of recent modifications and the immediate objective, even though it normally forgets past sessions. Essentially, the Git commit messages serve as "history summaries", while `TASKS.md` serves as a "to-do list", a combination identified as a useful tactic for mitigating LLM memory limitations.

## File Structure and Components
To set up this persistent memory system, organize your repository with the following components:

- **Git Repository with Commit History**: Make sure you're working in a Git-initialized project. Commit your changes frequently with clear, descriptive messages. Each commit message should summarize the change or feature implemented. For example, a commit message might read: "Add user authentication flow - implemented login API endpoint and JWT token generation." Descriptive commit messages are crucial, as they will become Codex's recall of what was done. (In fact, tools like Aider automatically commit AI changes with descriptive messages for this very reason.)
- **TASKS.md file**: At the root of your repo, maintain a Markdown file listing the project tasks or next features to implement. Each task should be a short, specific statement (preferably one line) describing a single goal, roughly on the order of a single sentence (~33 tokens). For example:

```markdown
# Project Tasks

- [ ] Implement user login page with form validation
- [ ] Set up JWT authentication for API endpoints
- [ ] Create user profile dashboard (fetch and display user data)
- [ ] Write unit tests for authentication flow
```

In this format, unchecked boxes `[ ]` denote pending tasks. The topmost unchecked task is the next immediate goal. (You can also number tasks or use a "Next:" label to explicitly mark the next task.) This file acts as a shared source of truth between you and the AI: Codex will read from it to know what to do next, and (optionally) can update it to mark tasks as completed.

- **Persistent Context File (Optional)**: The OpenAI Codex CLI supports an `AGENTS.md` (or previously `codex.md`) file that is automatically included in every prompt. You can use this to provide static instructions or persistent info to the AI. For instance, your `AGENTS.md` could contain guidance like: "You are working on Project X. Always read the latest tasks from `TASKS.md` and recall recent commit messages to maintain continuity." However, note that `AGENTS.md` is best for static or slowly-changing context. For highly dynamic context like the latest commit messages, you'll likely script their inclusion (discussed below) rather than hard-coding them in `AGENTS.md` each time.

Repository example structure:

```
my-project/
├── src/
│   └── ... (project code)...
├── TASKS.md <- Task list with upcoming work
├── AGENTS.md <- (Optional) Persistent instructions for Codex
└── ... (other files)...
```

With this setup, the key pieces of "memory" are in place. Next, we ensure Codex can automatically ingest these pieces on each session or invocation.

## Setup Instructions for Persistent Context
There are a few ways to feed the commit log and task info to ChatGPT Codex. We'll cover two common scenarios: using the OpenAI Codex CLI (or similar local agent) and using ChatGPT (Pro/Plus) in VS Code or the browser. In each case, the goal is to prepend the commit and task context to your queries.

### 1. Using the Codex CLI (Local Terminal Agent)
If you're using OpenAI's Codex CLI (a chat-driven coding agent in the terminal), you can automate context inclusion as follows:

**a. Leverage AGENTS.md for instructions**: Create an `AGENTS.md` file (if not already present) in your repo. Codex CLI will merge this into every prompt. In this file, explain how to use the commit log and tasks:

```markdown
Always maintain context by doing the following:
1. Read the last few Git commit messages to recall recent changes.
2. Open 'TASKS.md' and identify the next uncompleted task.
3. Use this information to guide your coding, ensuring continuity with past work and focus on the current task.
```

This primes the AI with the rule that it should consult those sources. (It doesn't literally pull in the data yet, but it sets the expectation.)

**b. Auto-inject commit messages and task content**: To actually provide the data, you have a couple of options:
- **Manual prompt injection**: At the start of a Codex CLI session or when context is cleared, you can manually copy-paste the latest commit messages and the next task. For example, begin by asking Codex: "Recall summary: $(latestCommits); Next task: $(nextTaskFromFile)". While manual, this is straightforward and ensures the AI sees the info.
- **Shell scripting**: For a more automated solution, wrap the Codex CLI invocation in a script or use its API. For instance, you might create a shell command that fetches the context then calls Codex:

```bash
LAST_COMMITS=$(git log -n3 --pretty=format:"%s - %b" | cut -c1-1000)  # last 3 commits, max ~1000 chars (~250-300 tokens)
NEXT_TASK=$(grep -m1 "- [ ]" TASKS.md | sed 's/- [ ] //')  # first unchecked task line
PROMPT="Recent work: $LAST_COMMITS \nNext task: $NEXT_TASK \nProceed with the next step."
codex "$PROMPT"
```

This pseudo-script grabs the last 3 commit messages (subject and body) and the first open task, then launches Codex with that as the initial prompt. Adjust the number of commits or token limit as needed to stay around 333 tokens for commits (and ~33 for the task). The Codex agent will then start with a response that is aware of this context.

**c. Allow Codex to read files if needed**: The Codex CLI agent (in suggest/auto modes) can read files from the repo when instructed. Ensure the CLI is running in a mode that permits file reads. If your `AGENTS.md` instructions were set, Codex might autonomously open `TASKS.md` or other files. If not, you can explicitly ask it: "Open TASKS.md and identify the next task, then proceed." It should output the file content or its summary. Similarly, you could ask it to show recent commits via a shell command if the CLI supports it (e.g., `git log -n3`). The key is that Codex has permission to access the repo's files so it can follow through on the instruction to retrieve context on its own if needed.

**d. Committing with informative messages**: As you and Codex make progress, continue to commit changes with meaningful messages. The CLI might auto-commit changes when you approve them (for example, Aider/Claude Code style) - ensure those commit messages are clear. For instance: "Setup JWT auth - created /auth.js, added login route, and tests". These will form the memory for the next session, so include keywords or task references ("JWT auth", "login route") that make it easy to understand later. Some users even include the task ID or name in the commit message (e.g., "Task: Implement login page [done]") to tie it back to `TASKS.md`. This practice can help Codex (or a human) see which task was addressed by that commit.

### 2. Using ChatGPT (Pro/VS Code) Interface
If you are using ChatGPT through the web interface (chat.openai.com) or via a VS Code extension rather than the CLI, the process is a bit more manual but still effective:

**a. Pre-session custom instruction**: In ChatGPT's Custom Instructions (for Plus users), you can add a note that you use a commit/task system. For example: "I work on coding projects with a file `TASKS.md` (containing my to-do list) and I maintain detailed git commit messages. If I provide you with recent commit messages and the next task, use them as context for our coding discussion." This doesn't feed dynamic data, but it primes the model to expect and make use of such data when given.

**b. Manual context provision**: At the start of a new chat (or whenever needed), paste a brief summary of recent commits and the next task from `TASKS.md`. You might say:

```markdown
Context: Last commits - feat: add login form (created Login.jsx, form state handling), fix: adjust auth API (updated auth routes, minor bugfix). Next Goal: Implement password reset email sending.
```

By providing this at the beginning of your prompt, you're effectively giving ChatGPT the same memory cues. Keep it concise to fit within ~333 tokens for commit summaries and ~33 tokens for the goal. ChatGPT will then understand the recent project state and current objective as it generates code.

**c. VS Code Extension Automation**: Some ChatGPT VS Code extensions can read from open files or provide context. If you have an extension that integrates with source control (SCM) or files, use it to your advantage. For instance, you might open `TASKS.md` in VS Code and copy its content into the chat, or use an extension command to explain changes. While not fully automatic, it streamlines the process:
- After making a commit, you could use an extension's command (if available) like "Summarize last commit" or simply copy the commit message from your Git panel.
- You might also maintain a running session notes file where you append each commit message and mark tasks done, then copy from there.

In all cases, the principle is to prepend context (recent commits + next task) to your query so the model is never "starting cold." This approach aligns with what Claude Code does by storing chat history and decisions in markdown files and reloading them for context. Here, we are just doing it manually or via scripting for Codex.

## Example Workflow
To illustrate how this works in practice, consider a simple real-world workflow:

1. **Initial setup**: You have a `TASKS.md` with a few planned tasks:

```markdown
- [ ] 1. Set up database schema for user accounts
- [ ] 2. Implement user registration API
- [ ] 3. Build frontend signup form
- [ ] 4. Write integration tests for user registration
```

You begin a Codex session and feed the first task context. For example: Context: (no commits yet on a brand new project) Next Task: "Set up database schema for user accounts." Codex then helps you write the database schema code.

2. **Commit changes**: Once the schema code is done, you commit with a message describing it: "Initialize user schema - created User table with fields (id, name, email, password hash, created_at)". You also mark task 1 as done in `TASKS.md` (e.g., change `[ ]` to `[x]` or move it to a "done" section). Now `TASKS.md` shows task 1 completed and task 2 as next.

3. **Next session or continued work**: Now you ask Codex to implement the user registration API. Before diving in, you provide context:
   - Recent commits (memory): "Initialize user schema - created User table with necessary fields." (This is one commit's message, well under 333 tokens).
   - Next task: "Implement user registration API (create user account with validation and hashing)." (short 33-token description).
   - Prompt to Codex: Using the CLI, this might have been auto-injected. In ChatGPT, you might say: "In the last session, I set up the DB schema (added a User table). The next step is to build the user registration API endpoint."

Codex now knows the database exists and can proceed to help with the registration API, writing code that uses the new User table.

4. **Repeat the cycle**: After the registration API is done, commit the changes: "Add register API - created /api/register route, adds new User to DB with hashed password." Mark task 2 done in `TASKS.md`. For the next task (frontend signup form), again feed the context: recent commits include the database setup and API creation; next task is the signup UI. Codex will use that knowledge to perhaps call the API correctly or ensure fields match the schema.

5. **Continuous updates**: Throughout, you and Codex continue this loop. The commit messages form a chronological narrative of the project. If you ever restart the agent or come back after a break, those commit messages (recent few) plus the next task from `TASKS.md` will quickly bring the AI back up to speed on "what it just did" and "what it should do next."

By following this workflow, Codex works with awareness of context that normally would be lost between sessions. You effectively create a chain of reasoning across sessions, anchored by files in your repo.

## Limitations and Best Practices
While this commit+task memory system is powerful, be mindful of its limitations and edge cases:

- **Context length**: Keep the injected context concise. The numbers 333 tokens for commits and 33 tokens for the next task are guidelines, not hard rules. The exact limit can be adjusted based on your model's context window (GPT-4 can handle more, GPT-3.5 much less). Aim to include the last few relevant commits rather than everything. If commit messages are long or numerous, you may include fewer of them or truncate/summarize older ones. Always include the most recent commit (since it's likely most relevant), and maybe 2-4 last commits total. If needed, summarize older commits into one line (e.g., "Previous: did initial setup and minor fixes") to save tokens.
- **Quality of commit messages**: This system's usefulness hinges on good commit practices. If your commit messages are too sparse or vague (e.g., "fix stuff" or "update code"), they won't jog the AI's memory effectively. Each message should answer the question: "What was accomplished or changed?" in a self-contained way. Think of commit messages as story beats in the project's narrative that the AI will read later. On the flip side, overly detailed commit bodies (e.g., including large diff excerpts or stack traces) could waste token space and potentially confuse the model. Strike a balance: clear and specific, but not verbose.
- **Managing TASKS.md**: Organize the tasks file so that it's easy to parse. Using a checklist format (`- [ ] Task`) is helpful, as the next open task is clearly identifiable. You might choose to only ever feed one task (the next immediate one) to the model to keep it focused. Alternatively, in some cases you might include two or three upcoming tasks if they are closely related (giving the model a sense of what's on the horizon), but generally limit it to avoid distraction. After a task is done, update `TASKS.md` promptly - either manually or have the AI do it with caution. Some users have the AI mark tasks as done, but note that AI might make mistakes editing a tasks file (e.g., marking off the wrong items or accidentally deleting content). A best practice is to review any AI-made edits to `TASKS.md` in version control. Since the tasks file is under git, you can diff changes if the AI modifies it, and revert/fix if it messed up the list. In mission-critical use, you may prefer to update the file yourself to maintain accuracy.
- **Potential AI confusion**: When injecting commit logs and tasks, make sure it's formatted or phrased clearly as context, so the model doesn't confuse it with a direct user instruction to code those lines. For example, prefixing with a label like "Context:" or separating memory from question helps. In the CLI, this might be less an issue if done as system message; in ChatGPT, providing it as a preamble before asking for new code is usually fine. Also, if the commit messages mention something unresolved or a bug fix, the model might latch onto that. It's usually helpful, but be prepared to clarify if it dwells on an irrelevant past detail. Trim any irrelevant commit info that isn't needed for the current task.
- **Scaling to large projects**: If your project is long-running, the commit history will grow. Feeding all past commits is neither feasible nor necessary. Typically the last few are enough, since they cover recent changes. However, if you resume work after a long gap, and the next task references something done a while ago, you may need to surface that older context. In such cases, you could search commit messages for keywords and include a summary of that relevant older commit. Another strategy is maintaining a `CHANGELOG` or `NOTES.md` where you write high-level summaries of each milestone - this file could be a quick way to remind the model of older context without dumping dozens of commits. You might include a short project summary in `AGENTS.md` (e.g., "Project X is a web app for ..., built with ..., so far implemented features A, B, C.") and keep it updated occasionally. This gives background context in addition to the very recent memory from commits.
- **Tooling limitations**: In the ChatGPT web UI, there's no direct automation for reading local git logs or files - you'll always need to paste or summarize the context yourself. By contrast, the Codex CLI or similar tools can script this injection. If you find yourself doing this often, investing time in a small automation script or using an existing tool like Aider or Claude Code CLI might pay off. For example, Claude Code automatically "remembers past chats and decisions using Markdown files" - essentially what we mimic with `TASKS.md` and commit logs here. Some of these tools might handle the heavy lifting of context management, though they might use different formats. If you stick with ChatGPT Codex, our described approach is DIY but gives you full control over what context the AI sees.
- **Error handling and verification**: Even with context, the AI might occasionally produce code that doesn't perfectly align with past work (LLMs can still misunderstand or hallucinate details). Always verify that the code integrates correctly with what was done before. The commit+task memory helps reduce such issues by reminding the model of correct names and recent changes (for example, it's less likely to reimplement a function that it sees was just created in the last commit). Still, test and review the AI's output. Use version control benefits: if Codex's suggestion is off-track, you can revert or adjust, guided by the persistent context.
- **Security and privacy**: Since this method works locally with your files, it generally keeps sensitive data within your environment. Just be aware that whatever you feed into ChatGPT's API (commit messages or tasks text) does leave your machine. Typically commit messages and task descriptions shouldn't contain secrets, but be mindful if they do. If using an API script, ensure your OpenAI API key and repo are handled safely (don't accidentally commit your key in the repo!). Using the CLI offline (with local models, etc.) would avoid sending data out, but with ChatGPT or Codex API it's going to OpenAI's servers. This is usually fine for most cases, but it's a consideration.

In summary, by maintaining a well-structured `TASKS.md` and descriptive commit history, and by systematically injecting that information into Codex's input, you create a feedback loop that keeps the AI aware of context across interactions. This approach addresses the lack of built-in long-term memory in ChatGPT/Codex with a pragmatic, file-based memory layer. It's a bit of upfront discipline (writing good commits, updating tasks), but it pays off with an AI coding assistant that feels far more attentive and stateful.

## Real-World Effectiveness
Many developers experimenting with AI pair-programmers have independently arrived at similar solutions. Using a task list and commit history to maintain continuity has become a best practice for managing AI "forgetfulness". It's not yet a plug-and-play feature of Codex - rather, it's a workflow habit you cultivate. As you apply this in your projects, you'll likely notice:

- **Improved coherence**: Codex will less often repeat work or contradict what it did previously, because the commit context reminds it of those changes.
- **Focused assistance**: With a clear next task given, the AI stays on task (it "knows" what to do, akin to how an engineer refers to a ticket or todo item).
- **Documentation by-product**: Your commit messages and tasks file serve as documentation. New collaborators (or other AI agents) could read `TASKS.md` and the git log to get up to speed, just like Codex does.

Of course, continue to iterate on the process. You might, for example, adjust the number of commits to include, or refine how you phrase tasks (some find that writing tasks in imperative form "Implement X" works best, others prefer user-story style "User should be able to X"). The guidelines above provide a starting framework that you can tweak to fit your workflow.

By following these best practices, you equip ChatGPT Codex with a form of pseudo-memory that greatly enhances its usefulness in multi-step development tasks. It's a clever workaround until more native long-term memory features arrive. Happy coding, and enjoy your more context-aware AI assistant!

## Sources
- OpenAI Codex CLI Documentation and Discussions - Using persistent context files (`AGENTS.md`) and context window management
- Claude Code vs. OpenAI Codex (Composio blog) - notes on memory management differences (Codex lacks persistent memory, Claude uses markdown files for history)
- Aider AI Pair Programming Docs - demonstrates using Git commits to track changes with descriptive messages
- Developer community experiences (Reddit) - using `TASKS.md` as a shared to-do list for AI agents and pitfalls to watch for
- Don Lim, "5-Step AI Coding Method" (Towards AI, 2025) - highlights task lists and history summaries as emerging techniques to counteract LLM memory limits
