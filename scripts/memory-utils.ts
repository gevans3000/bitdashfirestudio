import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Resolve base directory compatible with ESM and CJS
const baseDir = typeof __dirname !== 'undefined'
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = path.resolve(baseDir, "..");
export const memPath = process.env.MEM_PATH
  ? path.resolve(process.env.MEM_PATH)
  : path.join(repoRoot, "memory.log");
export const snapshotPath = process.env.SNAPSHOT_PATH
  ? path.resolve(process.env.SNAPSHOT_PATH)
  : path.join(repoRoot, "context.snapshot.md");

export function readMemoryLines(): string[] {
  if (!fs.existsSync(memPath)) return [];
  return fs.readFileSync(memPath, "utf8").trim().split("\n").filter(Boolean);
}

export function nextMemId(content?: string): string {
  let data = content;
  if (data === undefined) {
    if (!fs.existsSync(snapshotPath)) return "001";
    data = fs.readFileSync(snapshotPath, "utf8");
  }
  const matches = data.match(/mem-(\d+)/g);
  const last = matches && matches.length
    ? parseInt(matches[matches.length - 1].replace("mem-", ""), 10)
    : 0;
  return String(last + 1).padStart(3, "0");
}

export function atomicWrite(file: string, data: string): void {
  const dir = path.dirname(file);
  const tmp = path.join(dir, `.${path.basename(file)}.tmp`);
  const fd = fs.openSync(tmp, "w");
  fs.writeFileSync(fd, data);
  fs.fsyncSync(fd);
  fs.closeSync(fd);
  fs.renameSync(tmp, file);
  const dirFd = fs.openSync(dir, "r");
  fs.fsyncSync(dirFd);
  fs.closeSync(dirFd);
}

export interface FileLockOptions {
  staleMs?: number;
  acquireTimeoutMs?: number;
  maxRetries?: number;
}

export class LockAcquisitionTimeoutError extends Error {
  constructor(target: string) {
    super(`Timed out acquiring lock for ${target}`);
    this.name = 'LockAcquisitionTimeoutError';
  }
}

export function withFileLock(
  target: string,
  fn: () => void,
  opts: number | FileLockOptions = 60_000,
): void {
  const defaults = {
    staleMs: 60_000,
    acquireTimeoutMs: 120_000,
    maxRetries: Infinity,
  };
  let staleMs = defaults.staleMs;
  let acquireTimeoutMs = defaults.acquireTimeoutMs;
  let maxRetries = defaults.maxRetries;
  if (typeof opts === 'number') {
    staleMs = opts;
  } else {
    staleMs = opts.staleMs ?? staleMs;
    acquireTimeoutMs = opts.acquireTimeoutMs ?? acquireTimeoutMs;
    maxRetries = opts.maxRetries ?? maxRetries;
  }

  const verbose = process.env.DEBUG_FILE_LOCK === 'true';
  const callerInfo = verbose
    ? new Error().stack?.split('\n')[2]?.trim() ?? 'unknown'
    : '';
  const lock = `${target}.lock`;
  let fd: number | undefined;
  const start = Date.now();
  let tries = 0;
  if (verbose) {
    console.log(`[filelock] ${callerInfo} attempting to lock ${target}`);
  }
  while (fd === undefined) {
    if (
      (Date.now() - start > acquireTimeoutMs) ||
      (tries >= maxRetries && maxRetries !== Infinity)
    ) {
      if (verbose) {
        console.log(
          `[filelock] ${callerInfo} timed out after ${Date.now() - start}ms (${tries} tries)`,
        );
      }
      throw new LockAcquisitionTimeoutError(target);
    }
    try {
      fd = fs.openSync(lock, 'wx');
    } catch (err: any) {
      if (err.code === 'EEXIST') {
        let stale = false;
        try {
          const stat = fs.statSync(lock);
          if (Date.now() - stat.mtimeMs > staleMs) stale = true;
        } catch {
          stale = true;
        }
        if (stale) {
          try {
            fs.unlinkSync(lock);
          } catch {}
          continue;
        }
        tries += 1;
        if (verbose) {
          console.log(
            `[filelock] ${callerInfo} waiting on ${target}; try ${tries}; elapsed ${Date.now() - start}ms`,
          );
        }
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
      } else {
        throw err;
      }
    }
  }
  if (verbose) {
    console.log(
      `[filelock] ${callerInfo} acquired ${target} after ${Date.now() - start}ms (${tries} tries)`,
    );
  }
  fs.closeSync(fd);
  try {
    fn();
  } finally {
    fs.unlinkSync(lock);
  }
}

export type MemoryEntry =
  | CommitEntry
  | TaskEntry;

export interface BaseEntry {
  entryType: 'commit' | 'task';
  hash: string;
  summary: string;
  files: string;
  timestamp: string;
  raw: string;
}

export interface CommitEntry extends BaseEntry {
  entryType: 'commit';
}

export interface TaskEntry extends BaseEntry {
  entryType: 'task';
  task: string;
  description: string;
}

export function parseMemoryLines(lines: string[]): MemoryEntry[] {
  const entries: MemoryEntry[] = [];
  for (const raw of lines.filter(Boolean)) {
    const parts = raw.split('|').map((p) => p.trim());
    const [hash = '', ...rest] = parts;
    if (!hash) {
      console.error(`Malformed memory line: ${raw}`);
      continue;
    }

    let entry: MemoryEntry | undefined;

    if (rest.length >= 4) {
      // task entry with explicit task column
      const [task, desc, files, timestamp] = rest;
      entry = {
        entryType: 'task',
        hash,
        task,
        description: desc,
        summary: `${task}: ${desc}`,
        files,
        timestamp,
        raw,
      };
    } else if (rest.length === 3) {
      const [part2, files, timestamp] = rest;
      const match = part2.match(/^Task\s+([^:]+):\s*(.*)$/i);
      if (match) {
        entry = {
          entryType: 'task',
          hash,
          task: `Task ${match[1].trim()}`,
          description: match[2].trim(),
          summary: part2,
          files,
          timestamp,
          raw,
        };
      } else {
        entry = {
          entryType: 'commit',
          hash,
          summary: part2,
          files,
          timestamp,
          raw,
        };
      }
    } else if (rest.length === 2) {
      const [part2, timestamp] = rest;
      entry = {
        entryType: 'commit',
        hash,
        summary: part2,
        files: '',
        timestamp,
        raw,
      };
    } else {
      console.error(`Malformed memory line: ${raw}`);
      entry = {
        entryType: 'commit',
        hash,
        summary: rest[0] || '',
        files: rest[1] || '',
        timestamp: rest[2] || '',
        raw,
      };
    }

    entries.push(entry);
  }
  return entries;
}

export function validateMemoryEntry(entry: MemoryEntry): string[] {
  const errors: string[] = [];
  if (!/^[0-9a-f]{7,40}$/i.test(entry.hash)) {
    errors.push(`invalid hash: ${entry.hash}`);
  }

  if (!entry.timestamp || Number.isNaN(Date.parse(entry.timestamp))) {
    errors.push(`invalid timestamp for ${entry.hash}`);
  }

  if (entry.entryType === 'task') {
    if (!/^Task\s+\S+/.test(entry.task)) {
      errors.push(`invalid task field for ${entry.hash}`);
    }
    if (!entry.description) {
      errors.push(`missing task description for ${entry.hash}`);
    }
  } else {
    if (!entry.summary) {
      errors.push(`missing summary for ${entry.hash}`);
    }
  }

  if (
    entry.files &&
    !entry.files.split(',').every((f) => f.trim().length && !/\|/.test(f))
  ) {
    errors.push(`invalid file list for ${entry.hash}`);
  }

  return errors;
}


export interface SnapshotEntry {
  id: string;
  timestamp: string;
  commit: string;
  summary: string;
  next: string;
  raw: string;
}

export function parseSnapshotEntries(lines: string[]): SnapshotEntry[] {
  const entries: SnapshotEntry[] = [];
  let buffer: string[] = [];

  function pushBuffer() {
    if (!buffer.length) return;
    const raw = buffer.join('\n');
    const header = buffer[0].match(/^###\s+([^|]+)\s*\|\s*(mem-\d+)/);
    const timestamp = header ? header[1].trim() : '';
    const id = header ? header[2] : '';
    let commit = '';
    let summary = '';
    let next = '';
    for (const line of buffer.slice(1)) {
      const c = line.match(/^-\s*Commit SHA:\s*(\S+)/i);
      if (c) {
        commit = c[1];
        continue;
      }
      const s = line.match(/^-\s*Summary:\s*(.*)/i);
      if (s) {
        summary = s[1];
        continue;
      }
      const n = line.match(/^-\s*Next Goal:\s*(.*)/i);
      if (n) {
        next = n[1];
        continue;
      }
    }
    entries.push({ id, timestamp, commit, summary, next, raw });
    buffer = [];
  }

  for (const line of lines) {
    if (line.startsWith('### ')) {
      pushBuffer();
      buffer.push(line.trimEnd());
    } else if (buffer.length) {
      buffer.push(line.trimEnd());
    }
  }
  pushBuffer();
  return entries;
}
