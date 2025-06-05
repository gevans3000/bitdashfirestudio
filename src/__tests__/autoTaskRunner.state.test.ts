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
  const readMock = jest.spyOn(fs, 'readFileSync').mockImplementation((p: any, opt?: any) => {
    if (expanded[p as string]) p = expanded[p as string];
    return origRead.call(fs, p, opt);
  });
  const writeMock = jest.spyOn(fs, 'writeFileSync').mockImplementation((p: any, d: any, opt?: any) => {
    if (expanded[p as string]) p = expanded[p as string];
    return origWrite.call(fs, p, d, opt as any);
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

describe('autoTaskRunner writes', () => {
  afterEach(() => jest.restoreAllMocks());
  it('uses locks and atomic writes for tasks and signals', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'autorun-'));
    const tasks = path.join(dir, 'TASKS.md');
    const signals = path.join(dir, 'signals.json');
    fs.writeFileSync(tasks, '- [ ] test\n');
    fs.writeFileSync(signals, '{}\n');
    const map = {
      [path.join(repoRoot, 'TASKS.md')]: tasks,
      [path.join(repoRoot, 'signals.json')]: signals,
    } as Record<string, string>;

    const atomicMock = jest.spyOn(utils, 'atomicWrite').mockImplementation(() => {});
    const lockMock = jest.spyOn(utils, 'withFileLock').mockImplementation((_, fn) => { fn(); });

    const spawnMock = jest.spyOn(cp, 'spawnSync').mockReturnValue({ stdout: '', stderr: '', status: 0 } as any);
    const execMock = jest.spyOn(cp, 'execSync').mockReturnValue(Buffer.from(''));

    withFsMocks(map, () => {
      jest.isolateModules(() => {
        const { runTasks } = require('../../src/scripts/autoTaskRunner');
        runTasks();
      });
    });

    expect(lockMock.mock.calls.map(c => c[0])).toEqual(expect.arrayContaining([tasks, signals]));
    expect(atomicMock.mock.calls.map(c => c[0])).toEqual(expect.arrayContaining([tasks, signals]));

    fs.rmSync(dir, { recursive: true, force: true });
  });
});
