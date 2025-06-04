import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..');
const tasksMdPath = path.join(repoRoot, 'TASKS.md');
const queuePath = path.join(repoRoot, 'task_queue.json');

type Status = 'pending' | 'done';

interface Task {
  id: number;
  description: string;
  status: Status;
}

function parseTasksMd(file: string): Map<number, Status> {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const map = new Map<number, Status>();
  const regex = /^- \[( |x)\]\s*Task\s*(\d+)\b/;
  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      const status: Status = match[1] === 'x' ? 'done' : 'pending';
      const id = parseInt(match[2], 10);
      map.set(id, status);
    }
  }
  return map;
}

function parseQueue(file: string): Map<number, Status> {
  const list = JSON.parse(fs.readFileSync(file, 'utf8')) as Task[];
  const map = new Map<number, Status>();
  for (const t of list) map.set(t.id, t.status);
  return map;
}

function main() {
  const mdMap = parseTasksMd(tasksMdPath);
  const queueMap = parseQueue(queuePath);
  let ok = true;

  for (const [id, qStatus] of queueMap) {
    const mdStatus = mdMap.get(id);
    if (!mdStatus) {
      console.error(`Task ${id} missing from TASKS.md`);
      ok = false;
      continue;
    }
    if (mdStatus !== qStatus) {
      console.error(`Task ${id} status mismatch: md=${mdStatus} queue=${qStatus}`);
      ok = false;
    }
  }

  for (const id of mdMap.keys()) {
    if (!queueMap.has(id)) {
      console.error(`Task ${id} missing from task_queue.json`);
      ok = false;
    }
  }

  if (!ok) process.exit(1);
  else console.log('Tasks are in sync.');
}

if (import.meta.url === `file://${process.argv[1]}`) main();
