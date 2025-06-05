import fs from 'fs';
import os from 'os';
import path from 'path';
import * as utils from '../../scripts/memory-utils';

const { memPath, snapshotPath, repoRoot } = utils;

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

describe('mem-status', () => {
  it('prints last memory line, next mem-id and next task', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memstat-'));
    const memFile = path.join(dir, 'memory.log');
    const tasksFile = path.join(dir, 'TASKS.md');
    const snapFile = path.join(dir, 'context.snapshot.md');
    fs.writeFileSync(memFile, 'abc123 | test commit | file | 2025-01-01T00:00:00Z\n');
    fs.writeFileSync(tasksFile, '- [ ] Task 1: do something\n');
    fs.writeFileSync(snapFile, '');
    const logMock = jest.spyOn(console, 'log').mockImplementation(() => {});
    withFsMocks(
      {
        [memPath]: memFile,
        [path.join(repoRoot, 'TASKS.md')]: tasksFile,
        [snapshotPath]: snapFile,
      },
      () => {
        jest.isolateModules(() => {
          require('../../scripts/mem-status.ts');
        });
      }
    );
    expect(logMock).toHaveBeenCalledWith(
      'abc123 | test commit | file | 2025-01-01T00:00:00Z\nmem-001\nTask 1: do something'
    );
    logMock.mockRestore();
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
