import fs from 'fs';
import os from 'os';
import path from 'path';
import * as cp from 'child_process';
import * as utils from '../../scripts/memory-utils';

const { repoRoot } = utils;

function withFsMocks(paths: Record<string, string>, fn: () => void) {
  const expanded: Record<string, string> = {};
  for (const [k, v] of Object.entries(paths)) {
    expanded[k] = v;
    const tmpK = path.join(path.dirname(k), `.${path.basename(k)}.tmp`);
    const tmpV = path.join(path.dirname(v), `.${path.basename(v)}.tmp`);
    expanded[tmpK] = tmpV;
    expanded[`${k}.lock`] = `${v}.lock`;
  }
  const origExists = fs.existsSync;
  const origRead = fs.readFileSync;
  const origWrite = fs.writeFileSync;
  const origRename = fs.renameSync;
  const origOpen = fs.openSync;
  const origClose = fs.closeSync;
  const origUnlink = fs.unlinkSync;
  const existsMock = jest.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
    if (expanded[p as string]) return origExists.call(fs, expanded[p as string]);
    return origExists.call(fs, p);
  });
  const readMock = jest.spyOn(fs, 'readFileSync').mockImplementation((p: any, o?: any) => {
    if (expanded[p as string]) p = expanded[p as string];
    return origRead.call(fs, p, o);
  });
  const writeMock = jest.spyOn(fs, 'writeFileSync').mockImplementation((p: any, d: any, o?: any) => {
    if (expanded[p as string]) p = expanded[p as string];
    return origWrite.call(fs, p, d, o as any);
  });
  const renameMock = jest.spyOn(fs, 'renameSync').mockImplementation((a: any, b: any) => {
    if (expanded[a as string]) a = expanded[a as string];
    if (expanded[b as string]) b = expanded[b as string];
    return origRename.call(fs, a, b);
  });
  const openMock = jest.spyOn(fs, 'openSync').mockImplementation((p: any, f: any) => {
    if (expanded[p as string]) p = expanded[p as string];
    return origOpen.call(fs, p, f);
  });
  const closeMock = jest.spyOn(fs, 'closeSync').mockImplementation((fd: any) => origClose.call(fs, fd));
  const unlinkMock = jest.spyOn(fs, 'unlinkSync').mockImplementation((p: any) => {
    if (expanded[p as string]) p = expanded[p as string];
    return origUnlink.call(fs, p);
  });
  try {
    fn();
  } finally {
    existsMock.mockRestore();
    readMock.mockRestore();
    writeMock.mockRestore();
    renameMock.mockRestore();
    openMock.mockRestore();
    closeMock.mockRestore();
    unlinkMock.mockRestore();
  }
}

describe('update-memory', () => {
  it('updates memory log, snapshot and rotates', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'um-'));
    const tasks = path.join(dir, 'TASKS.md');
    const queue = path.join(dir, 'task_queue.json');
    fs.writeFileSync(tasks, '- [ ] Task 1: test');
    fs.writeFileSync(queue, '[{"id":1,"description":"test","status":"pending"}]');
    const paths = {
      [path.join(repoRoot, 'TASKS.md')]: tasks,
      [path.join(repoRoot, 'task_queue.json')]: queue,
    } as Record<string, string>;

    const calls: string[] = [];
    const execMock = jest.spyOn(cp, 'execSync').mockImplementation((cmd: string) => {
      calls.push(cmd);
      if (cmd.includes('git log -1 --pretty=%s')) return Buffer.from('Task 1: summary');
      if (cmd.startsWith('grep -m 1')) return Buffer.from('next');
      if (cmd.startsWith('git rev-parse')) return Buffer.from('abc123');
      return Buffer.from('');
    });

    withFsMocks(paths, () => {
      jest.isolateModules(() => {
        require('../../scripts/update-memory.ts');
      });
    });

    execMock.mockRestore();
    const outTasks = fs.readFileSync(tasks, 'utf8');
    const queueObj = JSON.parse(fs.readFileSync(queue, 'utf8'));

    expect(outTasks).toContain('- [x] Task 1: test');
    expect(queueObj[0].status).toBe('done');
    expect(calls.some((c) => c.includes('update-memory-log.ts'))).toBe(true);
    expect(calls.some((c) => c.includes('mem-rotate.ts'))).toBe(true);
    expect(calls.some((c) => c.includes('memory-check.ts'))).toBe(true);

    fs.rmSync(dir, { recursive: true, force: true });
  });
});
