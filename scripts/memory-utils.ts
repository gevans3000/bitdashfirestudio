import fs from 'fs';
import path from 'path';

export const repoRoot = path.resolve(__dirname, '..');
export const memPath = path.join(repoRoot, 'memory.log');
export const snapshotPath = path.join(repoRoot, 'context.snapshot.md');

export function readMemoryLines(): string[] {
  if (!fs.existsSync(memPath)) return [];
  return fs.readFileSync(memPath, 'utf8').trim().split('\n').filter(Boolean);
}

export function nextMemId(): string {
  let last = 0;
  if (fs.existsSync(snapshotPath)) {
    const matches = fs.readFileSync(snapshotPath, 'utf8').match(/mem-(\d+)/g);
    if (matches && matches.length) {
      const lastMatch = matches[matches.length - 1];
      last = parseInt(lastMatch.replace('mem-', ''), 10);
    }
  }
  return String(last + 1).padStart(3, '0');
}

export function atomicWrite(file: string, data: string): void {
  const dir = path.dirname(file);
  const tmp = path.join(dir, `.${path.basename(file)}.tmp`);
  const fd = fs.openSync(tmp, 'w');
  fs.writeFileSync(fd, data);
  fs.fsyncSync(fd);
  fs.closeSync(fd);
  fs.renameSync(tmp, file);
}

export function withFileLock(target: string, fn: () => void): void {
  const lock = `${target}.lock`;
  let fd: number | undefined;
  while (fd === undefined) {
    try {
      fd = fs.openSync(lock, 'wx');
    } catch (err: any) {
      if (err.code === 'EEXIST') {
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
