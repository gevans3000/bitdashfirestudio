import { execSync } from 'child_process';
import { repoRoot } from './memory-utils';

function lastCommitSummary(): string {
  const out = execSync('git log -1 --pretty=format:%s%n%n%b', {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
  return out || 'No summary';
}

function nextOpenTask(): string {
  try {
    const cmd = "grep -m 1 '^- \[ \]' TASKS.md | sed -E 's/^- \[ \] //'";
    const task = execSync(cmd, {
      cwd: repoRoot,
      shell: '/bin/bash',
      encoding: 'utf8',
    }).trim();
    return task || 'none';
  } catch {
    return 'none';
  }
}

const summary = lastCommitSummary();
const nextTask = nextOpenTask();

execSync(`ts-node scripts/append-memory.ts ${JSON.stringify(summary)} ${JSON.stringify(nextTask)}`, {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: '/bin/bash',
});
