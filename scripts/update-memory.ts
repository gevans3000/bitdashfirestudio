import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { repoRoot, atomicWrite, withFileLock } from './memory-utils';

function run(script: string) {
  const cmd = `node --loader ts-node/esm ${script}`;
  execSync(cmd, { cwd: repoRoot, stdio: 'inherit', shell: '/bin/bash' });
}

function updateSnapshot() {
  const summary = execSync('git log -1 --pretty=format:%s%n%n%b', {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim() || 'No summary provided.';
  let next = 'none';
  try {
    next = execSync("grep -m 1 '^- \\[ \\]' TASKS.md | sed -E 's/^- \\[ \\] //'", {
      cwd: repoRoot,
      shell: '/bin/bash',
      encoding: 'utf8',
    }).trim() || 'none';
  } catch {}
  run(`scripts/append-memory.ts ${JSON.stringify(summary)} ${JSON.stringify(next)}`);
}

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
  run('scripts/update-memory-log.ts');
  updateSnapshot();
  const id = currentTaskId();
  if (id !== null) markTaskDone(id);
  // rotate memory.log on every commit
  run('scripts/mem-rotate.ts');
  run('scripts/memory-check.ts');
}

main();
