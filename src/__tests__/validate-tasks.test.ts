import fs from 'fs';
import os from 'os';
import path from 'path';
import { repoRoot } from '../../scripts/memory-utils';

function withFsMocks(paths: Record<string, string>, fn: () => void) {
  const origExists = fs.existsSync;
  const origRead = fs.readFileSync;
  const existsMock = jest.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
    if (paths[p as string]) return origExists.call(fs, paths[p as string]);
    return origExists.call(fs, p);
  });
  const readMock = jest
    .spyOn(fs, 'readFileSync')
    .mockImplementation((p: any, opt?: any) => {
      if (paths[p as string]) p = paths[p as string];
      return origRead.call(fs, p, opt);
    });
  try {
    fn();
  } finally {
    existsMock.mockRestore();
    readMock.mockRestore();
  }
}

describe('validate-tasks', () => {
  it('exits non-zero when statuses mismatch', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'valt-'));
    const md = path.join(dir, 'TASKS.md');
    const queue = path.join(dir, 'task_queue.json');
    fs.writeFileSync(md, '- [ ] Task 1: test\n');
    fs.writeFileSync(queue, JSON.stringify([{ id: 1, description: 'test', status: 'done' }], null, 2));

    const exitMock = jest
      .spyOn(process, 'exit')
      .mockImplementation(((code?: number) => { throw new Error(String(code)); }) as any);
    const errMock = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      withFsMocks(
        {
          [path.join(repoRoot, 'TASKS.md')]: md,
          [path.join(repoRoot, 'task_queue.json')]: queue,
        },
        () => {
          jest.isolateModules(() => {
            require('../../scripts/validate-tasks.ts');
          });
        }
      );
    }).toThrow('1');

    fs.rmSync(dir, { recursive: true, force: true });
    errMock.mockRestore();
    exitMock.mockRestore();
  });
});
