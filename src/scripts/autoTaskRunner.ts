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
const signalsPath = path.join(repoRoot, 'signals.json');

const lines = fs.readFileSync(tasksPath, 'utf8').split('\n');
const idx = lines.findIndex((line) => line.startsWith('- [ ]'));
if (idx === -1) {
  console.log('No open tasks found.');
  process.exit(0);
}

const taskLine = lines[idx];
let taskDesc = taskLine.replace('- [ ]', '').trim();

const signals = JSON.parse(fs.readFileSync(signalsPath, 'utf8')) as {
  last_task_completed?: number | null;
  [key: string]: any;
};

const explicit = taskDesc.match(/Task\s*(\d+)\s*:/i);
let taskNum =
  explicit?.[1] !== undefined
    ? parseInt(explicit[1], 10)
    : typeof signals.last_task_completed === 'number'
      ? signals.last_task_completed + 1
      : 0;

if (explicit) {
  taskDesc = taskDesc.replace(explicit[0], '').trim();
}

// mark task as completed
lines[idx] = taskLine.replace('- [ ]', '- [x]');
fs.writeFileSync(tasksPath, lines.join('\n'));
signals.last_task_completed = taskNum;
fs.writeFileSync(signalsPath, JSON.stringify(signals, null, 2) + '\n');

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
execSync('git add TASKS.md logs signals.json');
const msg = `Task ${taskNum}: ${taskDesc}\n\nAutoTaskRunner completed task ${taskNum}.`;
execSync(`git commit -m "${msg.replace(/"/g, '\\"')}"`);
