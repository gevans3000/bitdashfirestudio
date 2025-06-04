import fs from 'fs';
import os from 'os';
import path from 'path';
import * as utils from '../../scripts/memory-utils';

const { snapshotPath, repoRoot } = utils;

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
  const existsMock = jest
    .spyOn(fs, 'existsSync')
    .mockImplementation((p: any) => {
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
      return origOpen.call(fs, p, flag);
    });
  const closeMock = jest
    .spyOn(fs, 'closeSync')
    .mockImplementation((fd: any) => origClose.call(fs, fd));
  const unlinkMock = jest
    .spyOn(fs, 'unlinkSync')
    .mockImplementation((p: any) => {
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

const iso = '2025-01-01T00:00:00.000Z';

describe('snapshot-rotate', () => {
  it('truncates context.snapshot.md and creates backup', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'snaprot-'));
    const tmpSnap = path.join(tmpDir, 'context.snapshot.md');
    const tmpBackup = path.join(tmpDir, `context.snapshot.${iso}.bak`);
    const data =
      '### 2024-12-31 | mem-001\n' +
      'a\n' +
      '### 2025-01-01 | mem-002\n' +
      'b\n' +
      '### 2025-01-02 | mem-003\n' +
      'c\n';
    fs.writeFileSync(tmpSnap, data);

    const map = {
      [snapshotPath]: tmpSnap,
      [path.join(repoRoot, 'logs', `context.snapshot.${iso}.bak`)]: tmpBackup,
    };

    withFsMocks(map, () => {
      process.env.SNAP_ROTATE_LIMIT = '2';
      jest.useFakeTimers().setSystemTime(new Date(iso));
      jest.isolateModules(() => {
        require('../../scripts/snapshot-rotate.ts');
      });
      jest.useRealTimers();
    });

    const snapOut = fs.readFileSync(tmpSnap, 'utf8');
    const backupOut = fs.readFileSync(tmpBackup, 'utf8');
    expect(snapOut).toBe(
      '### 2025-01-01 | mem-002\n' +
        'b\n' +
        '### 2025-01-02 | mem-003\n' +
        'c\n'
    );
    expect(backupOut).toBe(data);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
