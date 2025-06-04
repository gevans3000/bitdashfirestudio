import fs from 'fs';
import os from 'os';
import path from 'path';
import * as cp from 'child_process';
import * as utils from '../../scripts/memory-utils';

const { snapshotPath, memPath } = utils;

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
    if (expanded[p as string]) {
      return origExists.call(fs, expanded[p as string]);
    }
    return origExists.call(fs, p);
  });
  const readMock = jest.spyOn(fs, 'readFileSync').mockImplementation((p: any, opt?: any) => {
    if (expanded[p as string]) {
      p = expanded[p as string];
    }
    return origRead.call(fs, p, opt);
  });
  const writeMock = jest.spyOn(fs, 'writeFileSync').mockImplementation((p: any, data: any, opt?: any) => {
    if (expanded[p as string]) {
      p = expanded[p as string];
    }
    return origWrite.call(fs, p, data, opt as any);
  });
  const renameMock = jest.spyOn(fs, 'renameSync').mockImplementation((a: any, b: any) => {
    if (expanded[a as string]) a = expanded[a as string];
    if (expanded[b as string]) b = expanded[b as string];
    return origRename.call(fs, a, b);
  });
  const openMock = jest.spyOn(fs, 'openSync').mockImplementation((p: any, flag: any) => {
    if (expanded[p as string]) p = expanded[p as string];
    return origOpen.call(fs, p, flag);
  });
  const closeMock = jest.spyOn(fs, 'closeSync').mockImplementation((fd: any) => {
    return origClose.call(fs, fd);
  });
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

describe('nextMemId', () => {
  it('returns 001 when snapshot missing', () => {
    withFsMocks({ [snapshotPath]: path.join(os.tmpdir(), 'no-file') }, () => {
      expect(utils.nextMemId()).toBe('001');
    });
  });

  it('increments based on last mem entry', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memtest-'));
    const tmpSnap = path.join(tmpDir, 'context.snapshot.md');
    fs.writeFileSync(
      tmpSnap,
      '### 2020-01-01 | mem-001\n' +
        'some text\n' +
        '### 2020-01-02 | mem-009\n'
    );
    withFsMocks({ [snapshotPath]: tmpSnap }, () => {
      expect(utils.nextMemId()).toBe('010');
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe('update-memory-log', () => {
  it('appends new commit entries from git log', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memlog-'));
    const tmpMem = path.join(tmpDir, 'memory.log');
    fs.writeFileSync(tmpMem, 'abc123 | old commit | file1 | 2025-06-01T00:00:00Z\n');

    const execMock = jest
      .spyOn(cp, 'execSync')
      .mockImplementation((cmd: string) => {
        if (cmd.startsWith('git cat-file -e')) return Buffer.from('');
        if (cmd.startsWith('git log')) {
          return Buffer.from(
            'def456|new commit|2025-06-02T00:00:00Z\n' +
              'src/a.ts\n' +
              'src/b.ts\n'
          );
        }
        return Buffer.from('');
      });

    withFsMocks({ [memPath]: tmpMem }, () => {
      jest.isolateModules(() => {
        require('../../scripts/update-memory-log.ts');
      });
    });

    execMock.mockRestore();
    const out = fs.readFileSync(tmpMem, 'utf8').trim().split('\n');
    expect(out).toEqual([
      'abc123 | old commit | file1 | 2025-06-01T00:00:00Z',
      'def456 | new commit | src/a.ts, src/b.ts | 2025-06-02T00:00:00Z',
    ]);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe('atomicWrite', () => {
  it('calls fsync before rename', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'atomic-'));
    const file = path.join(dir, 'out.txt');
    const fsync = jest.spyOn(fs, 'fsyncSync').mockImplementation(() => {});

    utils.atomicWrite(file, 'data');

    expect(fsync).toHaveBeenCalled();

    fsync.mockRestore();
    const out = fs.readFileSync(file, 'utf8');
    expect(out).toBe('data');
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

