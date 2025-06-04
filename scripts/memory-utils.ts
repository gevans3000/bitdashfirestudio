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
