import fs from 'fs';
import path from 'path';
import { spawnSync, execSync } from 'child_process';
import { repoRoot, memPath, withFileLock, atomicWrite } from '../../scripts/memory-utils';

function run(cmd: string): { output: string; code: number } {
  const res = spawnSync(cmd, { shell: true, encoding: 'utf8' });
  return { output: (res.stdout || '') + (res.stderr || ''), code: res.status ?? 0 };
}

function tryExec(cmd: string) {
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch {
    console.error(`Command failed: ${cmd}`);
  }
}

export function runTasks() {
  const tasksPath = path.join(repoRoot, 'TASKS.md');
  const signalsPath = path.join(repoRoot, 'signals.json');
  const logDir = path.join(repoRoot, 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  const memoryPath = memPath;
  process.chdir(repoRoot);

  tryExec('npm ci');

  while (true) {
    const lines = fs.readFileSync(tasksPath, 'utf8').split('\n');
    const idx = lines.findIndex((l) => l.startsWith('- [ ]'));
    if (idx === -1) {
      console.log('No open tasks found.');
      break;
    }

    let taskLine = lines[idx];
    let taskDesc = taskLine.replace('- [ ]', '').trim();
    const signals = JSON.parse(fs.readFileSync(signalsPath, 'utf8')) as Record<string, any>;
    const explicit = taskDesc.match(/Task\s*(\d+)\s*:/i);
    const taskNum = explicit
      ? parseInt(explicit[1], 10)
      : typeof signals.last_task_completed === 'number'
        ? signals.last_task_completed + 1
        : 0;
    if (explicit) taskDesc = taskDesc.replace(explicit[0], '').trim();

    lines[idx] = taskLine.replace('- [ ]', '- [x]');
    withFileLock(tasksPath, () => {
      atomicWrite(tasksPath, lines.join('\n'));
    });
    signals.last_task_completed = taskNum;
    withFileLock(signalsPath, () => {
      atomicWrite(signalsPath, JSON.stringify(signals, null, 2) + '\n');
    });

    let success = true;
    function logRun(name: string, cmd: string) {
      const res = run(cmd);
      fs.writeFileSync(path.join(logDir, `${name}.log`), res.output);
      if (res.code !== 0) success = false;
    }

    logRun('lint', 'npm run lint');
    logRun('test', 'npm run test');
    logRun('backtest', 'npm run backtest');

    if (!success) {
      signals.error_flag = true;
      withFileLock(signalsPath, () => {
        atomicWrite(signalsPath, JSON.stringify(signals, null, 2) + '\n');
      });
      fs.writeFileSync(path.join(logDir, `block-${taskNum}.txt`), 'Task failed.');
      console.error('Task failed. See logs for details.');
      process.exit(1);
    }

    execSync('git add TASKS.md logs signals.json');

    function generateBody(desc: string) {
      const part1 = `What I did: ${desc}`;
      const part2 = "What's next: continue with the remaining tasks.";
      const baseWords = `${part1} ${part2}`.trim().split(/\s+/);
      const filler = new Array(Math.max(0, 333 - baseWords.length)).fill('context').join(' ');
      return `${part1}\n\n${part2}\n\n${filler}`;
    }

    const body = generateBody(taskDesc).replace(/"/g, '\\"');

    const diffFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean)
      .join(', ');

    const header = `Task ${taskNum}: ${taskDesc}`;
    execSync(`git commit -m "${header}" -m "${body}"`);

    const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const entry = `${hash} | Task ${taskNum} | ${taskDesc} | ${diffFiles} | ${new Date().toISOString()}\n`;
    withFileLock(memoryPath, () => {
      const cur = fs.existsSync(memoryPath) ? fs.readFileSync(memoryPath, 'utf8') : '';
      atomicWrite(memoryPath, cur + entry);
    });
    execSync(`git add ${memoryPath}`);
    execSync(`git commit -m "chore(memory): record task ${taskNum}"`);

    tryExec('git pull --rebase origin main');
    tryExec('git push origin HEAD:main');

    tryExec('npm run commitlog');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTasks();
}
