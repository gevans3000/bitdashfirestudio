import fs from 'fs';
import path from 'path';
import { readMemoryLines, nextMemId, memPath, repoRoot } from './memory-utils';

const tasksPath = path.join(repoRoot, 'TASKS.md');

const lines = readMemoryLines();
const last = lines.length ? lines[lines.length - 1] : 'none';

let task = 'none';
if (fs.existsSync(tasksPath)) {
  const tLines = fs.readFileSync(tasksPath, 'utf8').split('\n');
  const pending = tLines.find((l) => l.startsWith('- [ ] '));
  if (pending) task = pending.replace(/^- \[ \] /, '').trim();
}

const id = nextMemId();

console.log(`${last}\nmem-${id}\n${task}`);

