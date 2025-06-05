# Prioritized Tasks for Persistent Memory & Automation Improvement

This list prioritizes tasks to first ensure the stability and correctness of the existing system, then introduces enhancements for robustness and functionality. Each task includes a suggested prompt for an AI IDE coder, refined based on codebase analysis.

## Phase 1: Critical Integrity, Stability & Core Functionality Checks

These tasks address the most critical issues found and ensure the foundational components are robust.

1.  **Resolve `nextMemId` Race Condition for `context.snapshot.md`:**
    *   **Goal:** Ensure strictly unique `mem-XXX` IDs are generated for entries in `context.snapshot.md`, even under concurrent execution of `scripts/append-memory.ts`.
    *   **AI Coder Prompt:** "Refactor the `nextMemId()` function in `scripts/memory-utils.ts` and its usage within `scripts/append-memory.ts`. The current implementation (reading `snapshotPath` for the last ID *before* acquiring a file lock in `append-memory.ts`) can lead to duplicate `mem-XXX` IDs.
        Possible solutions:
        a) Move the logic for determining the next ID (reading `snapshotPath`, finding max ID, incrementing) *inside* the `withFileLock(snapshotPath, ...)` block in `scripts/append-memory.ts`.
        b) Implement a separate, lock-protected mechanism or file solely for managing the last `mem-XXX` ID counter if option (a) is not feasible.
        Ensure the chosen solution is robust against concurrency. Add specific tests that simulate multiple `append-memory.ts` instances running simultaneously to prove unique ID generation."

2.  **Robust Parsing & Validation for Dual-Format `memory.log` Entries:**
    *   **Goal:** Ensure `memory.log` entries from both `scripts/update-memory-log.ts` (git history) and `src/scripts/autoTaskRunner.ts` (task execution) are correctly parsed and validated.
    *   **AI Coder Prompt:** "Review and significantly refactor the `parseMemoryLines()` function and the `MemoryEntry` interface in `scripts/memory-utils.ts`. The system must correctly parse and represent two distinct entry formats found in `memory.log`:
        1.  From `scripts/update-memory-log.ts`: `hash | git_commit_summary | changed_files_from_git_log | git_commit_timestamp`
        2.  From `src/scripts/autoTaskRunner.ts`: `hash | "Task TASK_NUMBER: task_description_from_TASKS.md" | changed_files_from_git_diff_cached | iso_timestamp` (Note: The original prompt had "Task TASK_NUMBER | task_description..." as separate fields, but `autoTaskRunner.ts` joins them as `Task ${taskNum}: ${taskDesc}`).
        Update `MemoryEntry` to clearly distinguish or accommodate these formats (e.g., by adding an `entryType` field or using a union type for fields that differ).
        Enhance `validateMemoryEntry()` in `scripts/memory-utils.ts` to:
        a) Identify the entry type.
        b) Validate all expected fields for *that specific type* for presence, correct data type, and format (e.g., 'Task X: ...' structure for task entries, valid commit hash, valid ISO timestamp, format of file lists).
        c) Ensure parsing is resilient to minor variations or malformed lines, logging errors appropriately.
        Add comprehensive unit tests for parsing and validating both entry types, including edge cases."

3.  **Audit and Test Atomic File Operations & Locking (System-Wide):**
    *   **Goal:** Ensure all critical file writes across the system (e.g., `memory.log`, `context.snapshot.md`, `signals.json`, `TASKS.md`, log files in `logs/`) are truly atomic and race-condition-free.
    *   **AI Coder Prompt:** "Conduct a system-wide audit of all scripts that perform file writes to persistent data or critical state files (focus on `scripts/memory-utils.ts`, `scripts/append-memory.ts`, `scripts/update-memory-log.ts`, `src/scripts/autoTaskRunner.ts`, `scripts/mem-rotate.ts`).
        Verify that `atomicWrite()` and `withFileLock()` from `scripts/memory-utils.ts` are used correctly and consistently for *all* such operations.
        If any critical writes are not protected, refactor them to use these utilities.
        Review the existing tests for `atomicWrite` and `withFileLock`. Add more rigorous tests simulating concurrent access and write attempts to these key files to prove data integrity and absence of race conditions. Verify lock file cleanup mechanisms."

4.  **Verify Timestamp Ordering and Deduplication in `memory.log` (Handling Dual Formats):**
    *   **Goal:** Ensure data integrity regarding time and uniqueness in `memory.log`, considering its dual entry sources.
    *   **AI Coder Prompt:** "Review and enhance the timestamp ordering and commit hash deduplication checks, primarily within `scripts/memory-check.ts` and potentially `scripts/update-memory-log.ts`.
        Timestamp Ordering: The logic must correctly handle `memory.log` entries from both `scripts/update-memory-log.ts` (git commit dates) and `src/scripts/autoTaskRunner.ts` (task execution time). Define and implement a clear policy for 'correct order' (e.g., generally ascending, but how to interleave?). Add tests for various interleaving scenarios.
        Deduplication:
        a) `scripts/update-memory-log.ts` deduplicates based on git commit hash for entries it generates. Verify this.
        b) `scripts/memory-check.ts` checks for duplicate commit hashes. Ensure this check correctly distinguishes between the primary commit hash of a git log entry and the 'chore(memory): record task X' commit hash from `autoTaskRunner.ts` entries if they are different. The goal is to prevent genuinely identical entries while allowing distinct task entries.
        Add tests for edge cases in both ordering and deduplication."

5.  **Comprehensive `memory-check.ts` Enhancements & Testing:**
    *   **Goal:** Make `scripts/memory-check.ts` a thorough verifier for both `memory.log` (all formats) and `context.snapshot.md`.
    *   **AI Coder Prompt:** "Enhance `scripts/memory-check.ts`:
        1.  Ensure it uses the updated `parseMemoryLines` and `validateMemoryEntry` (from Task 2) that handle dual `memory.log` formats.
        2.  **Direct `context.snapshot.md` Validation:** Add a new section to `memory-check.ts` to directly parse and validate `context.snapshot.md` using `parseSnapshotEntries()` from `scripts/memory-utils.ts`. For each snapshot entry, validate its internal structure (presence and format of `id`, `timestamp`, `commit SHA`, `summary`). Check for duplicate `mem-XXX` IDs *directly within the snapshot file*. Verify that each `Commit SHA` listed in a snapshot entry corresponds to an actual commit in Git.
        3.  **Cross-Referencing Robustness:** Improve the existing cross-referencing between `memory.log` entries and `snapshot.md` entries. Ensure the regex used (`pattern = new RegExp(\`(mem-\\\\d+)[\\\\s\\\\S]*?Commit SHA: ${hash}\\\\b\`)`) is robust.
        4.  **Sequential `mem-ID` Check in Snapshot:** The check for sequential `mem-ID`s in `snapshot.md` (currently done during cross-referencing) should be thorough.
        Add comprehensive tests for `scripts/memory-check.ts` covering all its validation paths for both `memory.log` and `context.snapshot.md`, including various error conditions."

6.  **Test Memory Log Rotation (`scripts/mem-rotate.ts`) and Retention:**
    *   **Goal:** Confirm that `memory.log` rotation works as expected without data loss and handles post-rotation steps correctly.
    *   **AI Coder Prompt:** "Thoroughly test the log rotation functionality in `scripts/mem-rotate.ts`.
        1.  Verify that `memory.log` is correctly trimmed to the specified `limit`, keeping the *most recent* entries.
        2.  Confirm that the backup file in `logs/` contains the *complete original content* of `memory.log` before rotation.
        3.  Test with different `limit` values, including edge cases (e.g., limit = 0, limit = 1, limit > current number of lines).
        4.  Verify the `--dry-run` mode.
        5.  Ensure post-rotation calls to `scripts/commitlog.ts` and `scripts/memory-check.ts` are executed. `mem-rotate.ts` should exit with an error if `memory-check.ts` fails after rotation. Add tests for these interactions."

7.  **Audit and Test Backup and Recovery Procedures (General):**
    *   **Goal:** Ensure reliable recovery from data corruption or loss for all critical persistent data.
    *   **AI Coder Prompt:** "Review all documented or scripted backup and recovery procedures for `memory.log` AND `context.snapshot.md`. Test any existing backup/restore scripts (e.g., via `memory-cli.ts` if applicable). Simulate file corruption scenarios for both files (truncation, random byte changes) and verify that recovery procedures restore them to a valid, consistent state. If `rebuild-memory.ts` exists, test its accuracy by comparing output against known good originals."

8.  **Comprehensive CLI Command Coverage and Testing (`memory-cli.ts`):**
    *   **Goal:** Ensure all CLI commands for memory management are functional and handle errors gracefully.
    *   **AI Coder Prompt:** "Conduct a comprehensive review of all commands in `memory-cli.ts`. For each command (e.g., rotate, status, grep, update-log, check, backup, restore):
        1.  Verify correct output and actions with valid inputs.
        2.  Test with invalid inputs, missing arguments, and edge cases to ensure clear error messages and graceful handling.
        3.  Write new unit/integration tests for any untested commands/scenarios, focusing on error handling."

9.  **Verify Environment Variable and Configuration Usage (System-Wide):**
    *   **Goal:** Ensure consistent and correct use of configurations.
    *   **AI Coder Prompt:** "Audit all relevant scripts for consistent and correct use of environment variables (e.g., `MEM_PATH`, `SNAPSHOT_PATH`, `MEM_ROTATE_LIMIT`) and any configuration files. Remove hardcoded critical paths/settings. Add tests for custom path/config overrides."

10. **Full Audit & Testing of `src/scripts/autoTaskRunner.ts` Workflow:**
    *   **Goal:** Ensure the end-to-end automation workflow in `autoTaskRunner.ts` is robust, handles errors, and interacts correctly with persistent memory.
    *   **AI Coder Prompt:** "Perform a full audit and create comprehensive integration tests for `src/scripts/autoTaskRunner.ts`. Tests should cover:
        1.  Correct parsing of tasks from `TASKS.md`.
        2.  Atomic updates to `TASKS.md` and `signals.json` (ensure `atomicWrite` is used for `signals.json` if not already).
        3.  Execution and output logging for `lint`, `test`, `backtest` scripts.
        4.  Correct behavior on script success/failure (e.g., `error_flag` in `signals.json`, `block-TASKNUM.txt` creation).
        5.  Proper generation of git commits (both the main task commit and the subsequent 'chore(memory): record task X' commit).
        6.  Atomic appending of the correct entry format to `memory.log`.
        7.  Successful execution of `git pull --rebase`, `git push`, and `npm run commitlog`.
        8.  Error handling for `git` command failures or network issues during push/pull.
        9.  The main loop logic: processing multiple tasks, stopping when no tasks are left."

11. **Audit and Test `signals.json` Handling in `autoTaskRunner.ts`:**
    *   **Goal:** Ensure `signals.json` is read and written atomically and its state correctly reflects the automation process.
    *   **AI Coder Prompt:** "Review all reads and writes to `signals.json` within `src/scripts/autoTaskRunner.ts`. Ensure that file operations are atomic (e.g., using `atomicWrite` from `scripts/memory-utils.ts`). Add tests to verify that `last_task_completed` is updated correctly after each successful task iteration and that `error_flag` is set appropriately on failures. Test scenarios where `signals.json` might be missing or malformed at the start of `autoTaskRunner.ts`."


## Phase 2: Foundational Robustness Enhancements

Once the existing system is validated, these tasks add layers of robustness.

12. **Implement Entry-Level Checksums for `memory.log` Entries:**
    *   **Goal:** Add data integrity checks for individual `memory.log` entries.
    *   **AI Coder Prompt:** "Modify `scripts/memory-utils.ts` and relevant write paths (`scripts/update-memory-log.ts`, `src/scripts/autoTaskRunner.ts`) to calculate and append a checksum (e.g., CRC32) to each `memory.log` entry upon writing. Update `parseMemoryLines` to extract the checksum. Enhance `validateMemoryEntry` (or add a new check in `scripts/memory-check.ts`) to verify this checksum when entries are read/validated, flagging mismatches."

13. **Develop a Graceful Shutdown Handler for `autoTaskRunner.ts`:**
    *   **Goal:** Minimize inconsistent states if `autoTaskRunner.ts` is interrupted.
    *   **AI Coder Prompt:** "In `src/scripts/autoTaskRunner.ts`, implement a graceful shutdown handler for `SIGINT` and `SIGTERM`. If a task is partially processed (e.g., `TASKS.md` updated but not committed, or pre-commit scripts failed), the handler should attempt to revert to a consistent state or clearly log the interruption point. Ensure pending file writes are flushed."

## Phase 3: Advanced Features, Optimizations & Usability

With a robust core, these tasks enhance the system's capabilities.

14. **Memory Query CLI Tool Enhancements (`memory-cli.ts`):**
    *   **Goal:** Provide more powerful ways to query and analyze memory data from `memory.log`.
    *   **AI Coder Prompt:** "Extend `memory-cli.ts` for `memory.log` queries:
        1.  Advanced search: Regex on any part of the raw entry or specific parsed fields (considering dual formats).
        2.  Complex date range filtering.
        3.  Filtering by entry type (git log vs. autoTaskRunner task).
        4.  Flexible output: JSON, CSV, detailed Markdown for parsed entries."

15. **Rotation/Archiving Strategy for `context.snapshot.md`:**
    *   **Goal:** Manage the size and performance of `context.snapshot.md`.
    *   **AI Coder Prompt:** "Design and implement a rotation or archiving strategy for `context.snapshot.md`. Considerations:
        1.  Define criteria for rotation (number of entries, file size, age).
        2.  How to handle `mem-XXX` ID continuity and `nextMemId()` if parts of the snapshot are archived/rotated. This is critical.
        3.  Ensure atomic operations and backups for the rotation process.
        4.  This may require significant changes to `nextMemId()` and snapshot parsing."

16. **Review Utility of `logs/commit.log` (and `scripts/commitlog.ts`):**
    *   **Goal:** Simplify the system by removing redundant components.
    *   **AI Coder Prompt:** "Review the necessity of `logs/commit.log` (generated by `scripts/commitlog.ts`), which stores the last 20 raw entries from `memory.log`. Determine if direct operations on `memory.log` (e.g., `tail` or `grep` via `memory-cli.ts`) suffice. If redundant, deprecate `scripts/commitlog.ts` and remove its calls from other scripts (e.g., `scripts/mem-rotate.ts`, `src/scripts/autoTaskRunner.ts`)."

This list provides a roadmap. The specific order within phases can be adjusted based on immediate needs and findings from earlier tasks.