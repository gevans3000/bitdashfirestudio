# Application Enhancements & Next Steps (app2.md)

## 1. Introduction

This document outlines a prioritized list of development tasks to further enhance the persistent memory and automation systems of this application. For a general overview of the existing system architecture, components, setup, and operational procedures, please refer to [`app.md`](app.md:0).

The following tasks are designed to be standalone, allowing for parallel development where feasible, and are based on a detailed analysis of the current codebase. Each task includes a specific prompt intended for use with an AI IDE coder to guide implementation.

## 2. Prioritized Enhancement Tasks

The tasks are ordered based on their potential impact on system robustness, data integrity, core functionality improvements, and then extensibility.

---

**1. Enhance Core File Locking with Timeouts, Retries, and Verbose Logging**
*   **Task ID (Original):** 8
*   **Goal:** Improve the robustness and debuggability of the fundamental `withFileLock` utility in `scripts/memory-utils.ts`, which is critical for preventing data corruption across the application.
*   **AI Coder Prompt:** "Refactor the `withFileLock` function in `scripts/memory-utils.ts`:
    1.  Modify the `staleMs` parameter. Add new optional parameters to `withFileLock`: `acquireTimeoutMs` (overall timeout for acquiring the lock, e.g., 120,000ms) and `maxRetries` (maximum number of attempts to acquire the lock if `EEXIST` is encountered and the lock is not stale).
    2.  If the lock cannot be acquired within `acquireTimeoutMs` or after `maxRetries`, the function should throw a specific error (e.g., `LockAcquisitionTimeoutError`).
    3.  Implement an optional verbose logging mode for lock contention, triggerable by an environment variable (e.g., `DEBUG_FILE_LOCK=true`).
    4.  In verbose mode, when lock contention occurs (i.e., `EEXIST` and the lock is not deemed stale), log messages indicating:
        a. Which script/function is attempting to acquire the lock on `target`.
        b. That it's waiting due to an existing lock.
        c. Each retry attempt.
        d. How long it has been waiting in total.
        e. A message when it successfully acquires the lock or if it times out / exceeds retries.
    5.  Update existing callers of `withFileLock` if necessary to handle the new potential timeout error."

---

**2. Implement Two-Phase Update for `TASKS.md` and `signals.json` in `autoTaskRunner`**
*   **Task ID (Original):** 3
*   **Goal:** Increase the resilience of `src/scripts/autoTaskRunner.ts` against interruptions, ensuring that state files (`TASKS.md`, `signals.json`) are only fully updated after critical operations succeed.
*   **AI Coder Prompt:** "Enhance `src/scripts/autoTaskRunner.ts` to make updates to `TASKS.md` (marking task as `[x]`) and `signals.json` (updating `last_task_completed`) more resilient to interruptions during a task cycle.
    1.  Before modifying `TASKS.md` and `signals.json` directly, write the intended new states of these files to temporary files (e.g., `TASKS.md.tmp`, `signals.json.tmp`) using `atomicWrite` from `scripts/memory-utils.ts`.
    2.  Proceed with the task execution steps (lint, test, backtest, initial git commit of task progress).
    3.  Only *after* these critical operations are successful (before the `memory.log` update commit), atomically rename the temporary files to their final names (`TASKS.md`, `signals.json`).
    4.  If any of those critical operations fail, delete the temporary files, leaving the original `TASKS.md` and `signals.json` untouched for that task iteration, and ensure the `error_flag` in the *original* `signals.json` is set if possible (or log the failure thoroughly).
    5.  This aims to prevent a state where `TASKS.md` shows a task as done but the associated actions/commits didn't complete successfully."

---

**3. Implement Comprehensive `--dry-run` Mode for `autoTaskRunner`**
*   **Task ID (Original):** 6
*   **Goal:** Provide a safe way to test and debug the complex `src/scripts/autoTaskRunner.ts` workflow without making any actual changes to the system or repository.
*   **AI Coder Prompt:** "Implement a `--dry-run` command-line flag for `src/scripts/autoTaskRunner.ts`.
    When executed in dry-run mode, the script must:
    1.  Iterate through tasks in `TASKS.md` as it normally would.
    2.  Log to the console all actions it *would have taken* for each task. This includes:
        a. Which task it's processing.
        b. Intended changes to `TASKS.md` (e.g., "Would mark 'Task X' as complete").
        c. Intended changes to `signals.json` (e.g., "Would update last_task_completed to X").
        d. Commands it would execute for `lint`, `test`, `backtest`.
        e. Details of git commands it would run (`add`, `commit` messages, `pull`, `push`).
        f. The exact `memory.log` entry it would generate and append.
    3.  Crucially, in dry-run mode, the script must *not* modify any files on disk (`TASKS.md`, `signals.json`, `memory.log`, any files in `logs/`) and must *not* execute any git operations that write to the repository (`commit`, `push`) or change local state (`pull --rebase` that modifies working tree).
    4.  It can still execute read-only commands (e.g., `git diff --cached --name-only` to show what *would be* committed for the task) to provide informative output.
    5.  Ensure the loop correctly simulates proceeding to subsequent tasks if the current simulated task 'succeeds'."

---

**4. Introduce Structured Error Codes and Granular Reporting in `memory-check.ts`**
*   **Task ID (Original):** 2
*   **Goal:** Improve the clarity, debuggability, and potential for automated processing of integrity check results from `scripts/memory-check.ts`.
*   **AI Coder Prompt:** "Refactor the error reporting mechanism in `scripts/memory-check.ts`.
    1.  Define a comprehensive set of specific error codes (e.g., `ERR_DUPLICATE_HASH_MEMLOG`, `ERR_TIMESTAMP_ORDER_MEMLOG`, `ERR_MISSING_SNAPSHOT_REF_FOR_MEMLOG_COMMIT`, `ERR_INVALID_SNAPSHOT_ID_SEQUENCE`).
    2.  Modify `scripts/memory-check.ts` so that instead of pushing plain string messages to its `errors` array, it collects objects detailing each error, like `{ code: 'ERR_CODE', message: 'User-friendly detailed message', data: { offendingHash: 'abc...', actualValue: 'xyz', expectedValue: '123' } }`.
    3.  Update the final error output to be more structured: first, a summary count per error code, then the detailed list of errors.
    4.  Add a CLI flag (e.g., `--json-output`) to `scripts/memory-check.ts` to print these structured errors in JSON format for easier machine parsing or integration with other tools."

---

**5. Develop `memory.log` Reconciliation Utility for `autoTaskRunner` Entries**
*   **Task ID (Original):** 4
*   **Goal:** Create a tool to ensure data integrity between `TASKS.md` (tasks marked complete) and `memory.log` (entries logged by `autoTaskRunner`), allowing for recovery if `autoTaskRunner` fails to log a task.
*   **AI Coder Prompt:** "Create a new standalone script, e.g., `scripts/reconcile-task-memory.ts`. This utility should:
    1.  Read `TASKS.md` to identify all tasks marked as complete (`- [x]`).
    2.  For each completed task, determine its task number and description (as used by `autoTaskRunner.ts` for commit messages and `memory.log` entries).
    3.  Cross-reference with `signals.json` to confirm `last_task_completed` or to get task numbers if not explicit in `TASKS.md`.
    4.  Search the existing `memory.log` (using the robust dual-format parsing from `scripts/memory-utils.ts`) for entries corresponding to these completed tasks (matching the 'Task TASK_NUMBER: task_description' format).
    5.  If a `memory.log` entry for a task marked as completed in `TASKS.md` is missing, the script should attempt to reconstruct this missing `memory.log` entry. This involves:
        a. Finding the primary git commit made by `autoTaskRunner.ts` for that task's progress (e.g., by searching git history for commit messages like "Task TASK_NUMBER: description").
        b. Extracting the commit hash, changed files (from that commit), and using the commit date of that commit as the timestamp.
        c. The script should then offer to append the reconstructed entry to `memory.log` (using `atomicWrite` and `withFileLock` from `scripts/memory-utils.ts`).
    6.  Provide a `--dry-run` mode to report discrepancies and proposed entries without writing to `memory.log`."

---

**6. Implement `memory.log` Garbage Collection for Orphaned Git Commit Entries**
*   **Task ID (Original):** 10
*   **Goal:** Maintain the integrity and relevance of `memory.log` by removing entries that correspond to Git commits no longer present in the repository history (e.g., due to rebasing).
*   **AI Coder Prompt:** "Create a new standalone script, e.g., `scripts/gc-memory-log.ts`. This script should:
    1.  Parse all entries from `memory.log` using the robust dual-format parser from `scripts/memory-utils.ts`.
    2.  Identify entries that originate from `scripts/update-memory-log.ts` (i.e., those representing direct Git commits, not `autoTaskRunner` task records).
    3.  For each such Git commit entry, extract its commit hash. Verify that this commit hash still exists in the current Git repository using `git cat-file -e COMMIT_HASH`.
    4.  If a commit hash from a `memory.log` (git-history type) entry no longer exists in the Git repository (e.g., it was removed from history due to a `git rebase -i` and force push), this entry is considered 'orphaned'.
    5.  The script should report all identified orphaned entries, showing their full line from `memory.log`.
    6.  Add an option (e.g., `--prune-orphans`) to remove these orphaned entries from `memory.log`. This removal must be done atomically, rewriting `memory.log` without the orphaned entries (use `atomicWrite` and `withFileLock` from `scripts/memory-utils.ts`).
    7.  Include a `--dry-run` mode that reports orphaned entries without modifying `memory.log`. This tool helps maintain the integrity of `memory.log` relative to the live Git history."

---

**7. Implement Content-Addressable Storage for `context.snapshot.md` Entries**
*   **Task ID (Original):** 1
*   **Goal:** Improve the scalability, deduplication potential, and manageability of `context.snapshot.md` data by storing entry content in separate, hash-named files.
*   **AI Coder Prompt:** "Refactor the storage mechanism for entries currently appended to `context.snapshot.md`. Instead of appending full entries to a single monolithic Markdown file, implement a content-addressable storage system.
    1.  When a new snapshot entry is generated (e.g., by `scripts/append-memory.ts`), calculate a hash of its core content (excluding timestamp or `mem-ID` if they vary per instance of identical content).
    2.  Store the actual entry content in a separate file within a dedicated directory (e.g., `project_root/snapshots_store/CONTENT_HASH.md`).
    3.  Modify `context.snapshot.md` to become an index file. Each line in `context.snapshot.md` would now reference a content-addressed file, perhaps like: `TIMESTAMP | mem-ID | CONTENT_HASH | COMMIT_SHA | SUMMARY_SNIPPET`.
    4.  Update `scripts/memory-utils.ts#parseSnapshotEntries` to read this index and then load content from the referenced files.
    5.  Ensure `scripts/append-memory.ts` uses this new storage method, including atomic writes for both the index and content files.
    6.  Update `scripts/memory-check.ts` to verify the integrity of this new structure (e.g., check that all referenced content files exist and their hashes match)."

---

**8. Create `context.snapshot.md` Archiving and Pruning Script with `mem-ID` Integrity**
*   **Task ID (Original):** 7
*   **Goal:** Implement lifecycle management for `context.snapshot.md` to control its size and maintain performance, while ensuring `mem-ID` generation remains consistent.
*   **AI Coder Prompt:** "Develop a new script, e.g., `scripts/archive-snapshot.ts`, to manage the size and lifecycle of `context.snapshot.md`.
    1.  The script should accept arguments for pruning/archiving criteria (e.g., archive entries older than X days, keep only the latest Y entries, archive specific `mem-ID` ranges).
    2.  Identify entries to be archived based on these criteria.
    3.  Atomically move the *full content* of these archived entries from the live `context.snapshot.md` (or their content-addressed files if Task 7 - Content-Addressable Storage - is implemented) to a separate, structured archive location (e.g., `project_root/snapshots_archive/YEAR/MONTH/mem-ID.md` or similar).
    4.  The script should decide on a strategy for the live `context.snapshot.md`: either remove the archived entry lines entirely or replace them with a placeholder indicating the entry is archived and its new location.
    5.  **Critical:** This script must *not* disrupt the uniqueness or sequential nature of `mem-ID` generation by `scripts/memory-utils.ts#nextMemId`. `nextMemId` should still be able to determine the true next available ID based on the highest ID ever used, whether live or archived. This might involve `nextMemId` also consulting an archive index or a separate counter file if live snapshot becomes sparse.
    6.  Ensure all file operations for archiving and updating the live snapshot are atomic. Include a `--dry-run` mode."

---

**9. Introduce a Flexible Tagging System for `memory.log` Entries**
*   **Task ID (Original):** 9
*   **Goal:** Enhance `memory.log` entries with a tagging system to improve organization, searchability, and filtering capabilities, supporting both existing entry formats.
*   **AI Coder Prompt:** "Extend the `memory.log` system to support arbitrary key-value tags for its entries.
    1.  Define a consistent and unambiguous way to represent tags within the raw `memory.log` line format that works for *both* existing entry types (git-history entries and autoTaskRunner entries). This might involve adding a new pipe-separated section specifically for tags, or using a recognizable prefix within an existing text field (e.g., `summary` or a new dedicated `metadata` field) like `tags:[key1=value1;key2=value2]`.
    2.  Modify `scripts/update-memory-log.ts` (for git-history entries): Allow it to optionally derive tags, for example, from specially formatted text in git commit messages (e.g., `[tag:project=alpha]`).
    3.  Modify `src/scripts/autoTaskRunner.ts` (for task entries): Allow tags to be specified, perhaps in `TASKS.md` alongside the task description (e.g., `- [ ] My task [tag:type=feature,priority=high]`) and then extracted and included in the `memory.log` entry.
    4.  Update `scripts/memory-utils.ts#parseMemoryLines` and the `MemoryEntry` interface to parse and store these tags (e.g., as an object `entry.tags = {key1: 'value1'}`).
    5.  Update `scripts/memory-utils.ts#validateMemoryEntry` to validate the tag format if tags are present (e.g., ensure key-value structure is correct).
    6.  Update `scripts/memory-check.ts` to potentially perform checks based on tags or validate their consistency."

---

**10. Add Support for Optional GPG Encryption of `context.snapshot.md` Entry Content**
*   **Task ID (Original):** 5
*   **Goal:** Provide a security feature to encrypt sensitive information within `context.snapshot.md` entries.
*   **AI Coder Prompt:** "Modify `scripts/append-memory.ts` and `scripts/memory-utils.ts` to support optional GPG encryption for the *content* (summary, next goal) of entries written to `context.snapshot.md`.
    1.  In `scripts/append-memory.ts`: Add a new CLI flag (e.g., `--encrypt-snapshot`) and a mechanism to specify a GPG recipient key ID (e.g., via environment variable `GPG_SNAPSHOT_RECIPIENT_KEY` or another flag).
    2.  If encryption is requested, before writing the entry data (summary, next goal) to `context.snapshot.md` (or to its content-addressed file if Task 7 - Content-Addressable Storage - is implemented), encrypt this specific portion using a system call to `gpg --encrypt --armor -r RECIPIENT_KEY`. Store the resulting PGP message block.
    3.  The `context.snapshot.md` entry should clearly indicate that its content is encrypted (e.g., a special prefix or a metadata flag in the entry line: `### TIMESTAMP | mem-ID | encrypted | COMMIT_SHA`).
    4.  Update `scripts/memory-utils.ts#parseSnapshotEntries` (and any related display utilities or API endpoints that might serve this data) to recognize encrypted entries. If an entry is marked as encrypted, provide a mechanism or utility function that attempts to decrypt it using a system call to `gpg --decrypt`. This decryption would typically require the user running the script/accessing the API to have the corresponding GPG private key configured.
    5.  Metadata like timestamp, mem-ID, and commit SHA should remain unencrypted for indexing."

---

This document provides a structured approach to the next phase of development for your application's persistent memory and automation systems.