import fs from 'fs';
import os from 'os';
import path from 'path';
import * as utils from '../../scripts/memory-utils';

const { memPath, repoRoot } = utils;

function withFsMocks(
  paths: Record<string, string>,
  openCalls: string[],
  unlinkCalls: string[],
  fn: () => void,
) {
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
    if (expanded[p as string]) {
      return origExists.call(fs, expanded[p as string]);
    }
    return origExists.call(fs, p);
  });
  const readMock = jest
    .spyOn(fs, 'readFileSync')
    .mockImplementation((p: any, opt?: any) => {
      if (expanded[p as string]) {
        p = expanded[p as string];
      }
      return origRead.call(fs, p, opt);
    });
  const writeMock = jest
    .spyOn(fs, 'writeFileSync')
    .mockImplementation((p: any, data: any, opt?: any) => {
      if (expanded[p as string]) {
        p = expanded[p as string];
      }
      return origWrite.call(fs, p, data, opt as any);
    });
  const renameMock = jest
    .spyOn(fs, 'renameSync')
    .mockImplementation((a: any, b: any) => {
      if (expanded[a as string]) a = expanded[a as string];
      if (expanded[b as string]) b = expanded[b as string];
      return origRename.call(fs, a, b);
    });
  const openMock = jest
    .spyOn(fs, 'openSync')
    .mockImplementation((p: any, flag: any) => {
      if (expanded[p as string]) p = expanded[p as string];
      openCalls.push(p as string);
      return origOpen.call(fs, p, flag);
    });
  const closeMock = jest
    .spyOn(fs, 'closeSync')
    .mockImplementation((fd: any) => origClose.call(fs, fd));
  const unlinkMock = jest
    .spyOn(fs, 'unlinkSync')
    .mockImplementation((p: any) => {
      if (expanded[p as string]) p = expanded[p as string];
      unlinkCalls.push(p as string);
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

describe('commit-log', () => {
  it('creates a lock file during write', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'commitlog-'));
    const mem = path.join(dir, 'memory.log');
    const commit = path.join(dir, 'commit.log');
    fs.writeFileSync(mem, '1\n2\n');

    const openCalls: string[] = [];
    const unlinkCalls: string[] = [];
    const map = {
      [memPath]: mem,
      [path.join(repoRoot, 'logs/commit.log')]: commit,
    } as Record<string, string>;

    withFsMocks(map, openCalls, unlinkCalls, () => {
      jest.isolateModules(() => {
        require('../../scripts/commit-log.ts');
      });
    });

    expect(openCalls).toContain(`${commit}.lock`);
    expect(unlinkCalls).toContain(`${commit}.lock`);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
