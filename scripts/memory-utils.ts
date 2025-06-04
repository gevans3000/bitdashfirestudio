import fs from "fs";
import path from "path";

export const repoRoot = path.resolve(__dirname, "..");
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
  const lines = data.split("\n");
  const entries = parseSnapshotEntries(lines);
  let last = 0;
  for (const e of entries) {
    const num = parseInt(e.id.replace("mem-", ""), 10);
    if (num > last) last = num;
  }
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

export function withFileLock(
  target: string,
  fn: () => void,
  staleMs = 60_000,
): void {
  const lock = `${target}.lock`;
  let fd: number | undefined;
  while (fd === undefined) {
    try {
      fd = fs.openSync(lock, "wx");
    } catch (err: any) {
      if (err.code === "EEXIST") {
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
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
      } else {
        throw err;
      }
    }
  }
  fs.closeSync(fd);
  try {
    fn();
  } finally {
    fs.unlinkSync(lock);
  }
}

export interface MemoryEntry {
  hash: string;
  task?: string;
  summary: string;
  files: string;
  timestamp: string;
  raw: string;
}

export function parseMemoryLines(lines: string[]): MemoryEntry[] {
  return lines.filter(Boolean).map((raw) => {
    const parts = raw.split("|").map((p) => p.trim());
    const [hash, p2 = "", p3 = "", p4 = "", p5 = ""] = parts;
    let task: string | undefined;
    let summary = "";
    let files = "";
    let timestamp = "";
    if (parts.length >= 5) {
      task = p2;
      summary = p3;
      files = p4;
      timestamp = p5;
    } else if (parts.length === 4) {
      summary = p2;
      files = p3;
      timestamp = p4;
    } else if (parts.length === 3) {
      summary = p2;
      files = "";
      timestamp = p3;
    }
    return { hash, task, summary, files, timestamp, raw };
  });
}

export function validateMemoryEntry(entry: MemoryEntry): string[] {
  const errors: string[] = [];
  if (!/^[0-9a-f]{7,40}$/i.test(entry.hash)) {
    errors.push(`invalid hash: ${entry.hash}`);
  }
  if (!entry.summary) {
    errors.push(`missing summary for ${entry.hash}`);
  }
  if (!entry.timestamp || Number.isNaN(Date.parse(entry.timestamp))) {
    errors.push(`invalid timestamp for ${entry.hash}`);
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
