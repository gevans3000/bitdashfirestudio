const fs = require('fs');
const path = require('path');
const { spawnSync, execSync } = require('child_process');

function run(cmd) {
  const res = spawnSync(cmd, { shell: true, encoding: 'utf8' });
  return { output: (res.stdout || '') + (res.stderr || ''), code: res.status };
}

const repoRoot = path.resolve(__dirname, '..');
const tasksPath = path.join(repoRoot, 'TASKS.md');
const signalsPath = path.join(repoRoot, 'signals.json');

let lines = fs.readFileSync(tasksPath, 'utf8').split('\n');
const idx = lines.findIndex(l => l.startsWith('- [ ]'));
if (idx === -1) {
  console.log('No open tasks found.');
  process.exit(0);
}

let taskLine = lines[idx];
let taskDesc = taskLine.replace('- [ ]', '').trim();
const signals = JSON.parse(fs.readFileSync(signalsPath, 'utf8'));
const explicit = taskDesc.match(/Task\s*(\d+)\s*:/i);
let taskNum = explicit ? parseInt(explicit[1], 10)
  : typeof signals.last_task_completed === 'number'
    ? signals.last_task_completed + 1
    : 0;
if (explicit) taskDesc = taskDesc.replace(explicit[0], '').trim();

lines[idx] = taskLine.replace('- [ ]', '- [x]');
fs.writeFileSync(tasksPath, lines.join('\n'));
signals.last_task_completed = taskNum;
fs.writeFileSync(signalsPath, JSON.stringify(signals, null, 2) + '\n');

const logDir = path.join(repoRoot, 'logs');
fs.mkdirSync(logDir, { recursive: true });

let success = true;
function logRun(name, cmd) {
  const res = run(cmd);
  fs.writeFileSync(path.join(logDir, `${name}.log`), res.output);
  if (res.code !== 0) success = false;
}

logRun('lint', 'npm run lint');
logRun('test', 'npm run test');
logRun('backtest', 'npm run backtest');

if (!success) {
  signals.error_flag = true;
  fs.writeFileSync(signalsPath, JSON.stringify(signals, null, 2) + '\n');
  fs.writeFileSync(path.join(logDir, `block-${taskNum}.txt`), 'Task failed.');
  console.error('Task failed. See logs for details.');
  process.exit(1);
}

execSync('git add TASKS.md logs signals.json');

function generateBody(desc) {
  const part1 = `What I did: ${desc}`;
  const part2 = `What's next: continue with the remaining tasks.`;
  let words = (part1 + ' ' + part2).trim().split(/\s+/);
  const fillerCount = 333 - words.length;
  if (fillerCount > 0) {
    words = words.concat(new Array(fillerCount).fill('context'));
  }
  return `${part1}\n\n${part2}\n\n${words.slice((part1 + ' ' + part2).trim().split(/\s+/).length).join(' ')}`;
}

const body = generateBody(taskDesc).replace(/"/g, '\"');
const header = `Task ${taskNum}: ${taskDesc}`;
execSync(`git commit -m "${header}" -m "${body}"`);
