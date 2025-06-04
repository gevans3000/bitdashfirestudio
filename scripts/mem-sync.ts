import { execSync } from 'child_process';
import {
  readMemoryLines,
  parseMemoryLines,
  memPath,
  repoRoot,
  atomicWrite,
  withFileLock,
} from './memory-utils';

const branch = process.argv[2];
if (!branch) {
  console.error('Usage: ts-node scripts/mem-sync.ts <branch>');
  process.exit(1);
}

let otherLog = '';
try {
  otherLog = execSync(`git show ${branch}:memory.log`, {
    cwd: repoRoot,
    encoding: 'utf8',
  });
} catch {
  console.error(`Unable to read memory.log from ${branch}`);
  process.exit(1);
}

const otherLines = otherLog.trim().split('\n').filter(Boolean);
const localLines = readMemoryLines();
const combined = parseMemoryLines([...localLines, ...otherLines]);
combined.sort(
  (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)
);
const seen = new Set<string>();
const result: string[] = [];
for (const entry of combined) {
  if (seen.has(entry.hash)) continue;
  seen.add(entry.hash);
  result.push(entry.raw.trim());
}

withFileLock(memPath, () => {
  atomicWrite(memPath, result.join('\n') + '\n');
});

console.log('memory.log synchronized');

