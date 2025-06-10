import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { repoRoot, atomicWrite, withFileLock } from './memory-utils';
import { updateLog, snapshotUpdate, rotate } from './memory-cli';


function markTaskDone(id: number) {
  const tasksPath = path.join(repoRoot, 'TASKS.md');
  let updated = false;
  withFileLock(tasksPath, () => {
    const lines = fs.readFileSync(tasksPath, 'utf8').split('\n');
    const regex = new RegExp(`^- \\[ \\] Task\\s*${id}\\b`);
    for (let i = 0; i < lines.length; i++) {
      if (regex.test(lines[i])) {
        lines[i] = lines[i].replace('- [ ]', '- [x]');
        updated = true;
        break;
      }
    }
    if (updated) atomicWrite(tasksPath, lines.join('\n'));
  });
  // task queue removed; only update TASKS.md
}

function currentTaskId(): number | null {
  const msg = execSync('git log -1 --pretty=%s', { cwd: repoRoot, encoding: 'utf8' }).trim();
  const m = msg.match(/^Task\s*(\d+):/);
  return m ? parseInt(m[1], 10) : null;
}

function main() {
  updateLog();
  snapshotUpdate();
  const id = currentTaskId();
  if (id !== null) markTaskDone(id);
  // rotate memory.log on every commit
  rotate();
  execSync('node --loader ts-node/esm scripts/memory-check.ts', {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: '/bin/bash',
  });
}

main();
