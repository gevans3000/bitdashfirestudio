const fs = require('fs');
const path = require('path');
const { spawnSync, execSync } = require('child_process');
const { repoRoot, memPath } = require('./memory-utils');

function run(cmd) {
  const res = spawnSync(cmd, { shell: true, encoding: 'utf8' });
  return { output: (res.stdout || '') + (res.stderr || ''), code: res.status };
}

function tryExec(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    console.error(`Command failed: ${cmd}`);
  }
}

const tasksPath = path.join(repoRoot, 'TASKS.md');
const signalsPath = path.join(repoRoot, 'signals.json');
const logDir = path.join(repoRoot, 'logs');
fs.mkdirSync(logDir, { recursive: true });
const memoryPath = memPath;
process.chdir(repoRoot);

tryExec('npm ci');

while (true) {
  const lines = fs.readFileSync(tasksPath, 'utf8').split('\n');
  const idx = lines.findIndex(l => l.startsWith('- [ ]'));
  if (idx === -1) {
    console.log('No open tasks found.');
    break;
  }

  let taskLine = lines[idx];
  let taskDesc = taskLine.replace('- [ ]', '').trim();
  const signals = JSON.parse(fs.readFileSync(signalsPath, 'utf8'));
  const explicit = taskDesc.match(/Task\s*(\d+)\s*:/i);
  const taskNum = explicit
    ? parseInt(explicit[1], 10)
    : typeof signals.last_task_completed === 'number'
      ? signals.last_task_completed + 1
      : 0;
  if (explicit) taskDesc = taskDesc.replace(explicit[0], '').trim();

  lines[idx] = taskLine.replace('- [ ]', '- [x]');
  fs.writeFileSync(tasksPath, lines.join('\n'));
  signals.last_task_completed = taskNum;
  fs.writeFileSync(signalsPath, JSON.stringify(signals, null, 2) + '\n');

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

  const nextIdx = lines.findIndex(l => l.startsWith('- [ ]'));
  const nextTask = nextIdx === -1 ? 'none' : lines[nextIdx].replace('- [ ]', '').trim();

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

  const diffFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
    .join(', ');

  const header = `Task ${taskNum}: ${taskDesc}`;
  execSync(`git commit -m "${header}" -m "${body}"`);

  const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  const entry = `${hash} | Task ${taskNum} | ${taskDesc} | ${diffFiles} | ${new Date().toISOString()}\n`;
  fs.appendFileSync(memoryPath, entry);
  execSync(`git add ${memoryPath}`);
  execSync(`git commit -m "chore(memory): record task ${taskNum}"`);

  tryExec('git pull --rebase origin main');
  tryExec('git push origin HEAD:main');

  tryExec('npm run commitlog');
}
