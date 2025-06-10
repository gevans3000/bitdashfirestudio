import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { repoRoot } from '../../scripts/memory-utils';

function runValidate(md: string, queue: string) {
  const wrapper = path.join(os.tmpdir(), `validate-${Date.now()}.mjs`);
  const script = `import fs from 'fs';
const paths = JSON.parse(process.argv[2]);
const origRead = fs.readFileSync;
const origExists = fs.existsSync;
fs.readFileSync = (p, o) => origRead.call(fs, paths[p] || p, o);
fs.existsSync = (p) => origExists.call(fs, paths[p] || p);
import('${path
    .join(repoRoot, 'scripts/validate-tasks.ts')
    .replace(/\\/g, '\\\\')}');`;
  fs.writeFileSync(wrapper, script);
  const res = spawnSync(
    'node',
    [
      '-r',
      'ts-node/register',
      wrapper,
      JSON.stringify({
        [path.join(repoRoot, 'TASKS.md')]: md,
        [path.join(repoRoot, 'task_queue.json')]: queue,
      }),
    ],
    { encoding: 'utf8' },
  );
  fs.rmSync(wrapper, { force: true });
  return res;
}

describe('validate-tasks', () => {
  it('exits non-zero when statuses mismatch', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'valt-'));
    const md = path.join(dir, 'TASKS.md');
    const queue = path.join(dir, 'task_queue.json');
    fs.writeFileSync(md, '- [ ] Task 1: test\n');
    fs.writeFileSync(queue, JSON.stringify([{ id: 1, description: 'test', status: 'done' }], null, 2));

    const res = runValidate(md, queue);
    expect(res.status).toBe(1);

    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('prints success when files match', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'valt-'));
    const md = path.join(dir, 'TASKS.md');
    const queue = path.join(dir, 'task_queue.json');
    fs.writeFileSync(md, '- [ ] Task 1: test\n');
    fs.writeFileSync(queue, JSON.stringify([{ id: 1, description: 'test', status: 'pending' }], null, 2));

    const res = runValidate(md, queue);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('Tasks are in sync.');

    fs.rmSync(dir, { recursive: true, force: true });
  });
});
