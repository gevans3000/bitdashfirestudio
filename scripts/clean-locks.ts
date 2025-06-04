import fs from 'fs';
import path from 'path';
import { repoRoot } from './memory-utils';

export const LOCK_TTL_MS = parseInt(process.env.LOCK_TTL || '', 10) || 300_000;

export function cleanLocks(root: string = repoRoot, ttl: number = LOCK_TTL_MS): void {
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop() as string;
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && entry.name.endsWith('.lock')) {
        try {
          const stat = fs.statSync(full);
          if (Date.now() - stat.mtimeMs > ttl) {
            fs.unlinkSync(full);
          }
        } catch {}
      }
    }
  }
}

if (require.main === module) {
  cleanLocks();
}
