import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' })
  .trim();

function getRecentCommits(): string {
  try {
    const log = execSync("git log -n 5 --pretty=format:'- %h %s'", {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    return log.trim();
  } catch {
    return 'No commits found';
  }
}

function getNextTask(): string {
  const tasksPath = path.join(repoRoot, 'TASKS.md');
  if (!fs.existsSync(tasksPath)) return 'None';
  const lines = fs.readFileSync(tasksPath, 'utf8').split('\n');
  const pending = lines.find((l) => l.startsWith('- [ ] '));
  if (!pending) return 'None';
  return pending.replace(/^- \[ \] /, '').trim();
}

const commits = getRecentCommits();
const nextTask = getNextTask();

console.log(`Recent work:\n${commits}\nNext task: ${nextTask}`);
