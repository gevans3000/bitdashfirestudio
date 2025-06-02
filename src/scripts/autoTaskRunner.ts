import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function run(cmd: string) {
  try {
    return execSync(cmd, { encoding: 'utf8' });
  } catch (err: any) {
    return (err as any).stdout || (err as Error).message;
  }
}

const repoRoot = path.resolve(__dirname, '../..');
const tasksPath = path.join(repoRoot, 'TASKS.md');
const lines = fs.readFileSync(tasksPath, 'utf8').split('\n');
const idx = lines.findIndex((line) => line.startsWith('- [ ]'));
if (idx === -1) {
  console.log('No open tasks found.');
  process.exit(0);
}

const taskLine = lines[idx];
const taskDesc = taskLine.replace('- [ ]', '').trim();

// mark task as completed
lines[idx] = taskLine.replace('- [ ]', '- [x]');
fs.writeFileSync(tasksPath, lines.join('\n'));

// ensure logs directory exists
const logDir = path.join(repoRoot, 'logs');
fs.mkdirSync(logDir, { recursive: true });

// run lint, test, backtest and capture logs
const lintLog = run('npm run lint');
fs.writeFileSync(path.join(logDir, 'lint.log'), lintLog);

const testLog = run('npm run test');
fs.writeFileSync(path.join(logDir, 'test.log'), testLog);

const backtestLog = run('npm run backtest');
fs.writeFileSync(path.join(logDir, 'backtest.log'), backtestLog);

// stage changes and commit
execSync('git add TASKS.md logs');
const msg = `feat(task): ${taskDesc}\n\nAutoTaskRunner completed task: ${taskDesc}`;
execSync(`git commit -m "${msg.replace(/"/g, '\\"')}"`);
