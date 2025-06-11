import fs from 'fs';
import os from 'os';
import path from 'path';

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

describe('memory archive and restore', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.MEM_PATH;
    delete process.env.SNAPSHOT_PATH;
  });

  it('archives memory.log and snapshot to logs/archive', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memarc-'));
    const archiveDir = path.join(dir, 'archive');
    fs.mkdirSync(archiveDir);
    const mem = path.join(dir, 'memory.log');
    const snap = path.join(dir, 'context.snapshot.md');
    fs.writeFileSync(mem, 'mem');
    fs.writeFileSync(snap, 'snap');

    process.env.MEM_PATH = mem;
    process.env.SNAPSHOT_PATH = snap;

    jest.useFakeTimers().setSystemTime(new Date(iso));
    jest.isolateModules(() => {
      const utils = require('../../scripts/memory-utils');
      const { archiveFiles } = require('../../scripts/memory-cli');
      const ts = new Date().toISOString().replace(/[:]/g, '-');
      const map = {
        [utils.memPath]: mem,
        [utils.snapshotPath]: snap,
        [path.join(utils.repoRoot, 'logs', 'archive')]: archiveDir,
        [path.join(utils.repoRoot, 'logs', 'archive', `memory.log.${ts}`)]:
          path.join(archiveDir, `memory.log.${ts}`),
        [path.join(utils.repoRoot, 'logs', 'archive', `context.snapshot.md.${ts}`)]:
          path.join(archiveDir, `context.snapshot.md.${ts}`),
      } as Record<string, string>;
      withFsMocks(map, () => {
        archiveFiles();
      });
    });
    jest.useRealTimers();

    const tsFile = iso.replace(/[:]/g, '-');
    const memDest = path.join(archiveDir, `memory.log.${tsFile}`);
    const snapDest = path.join(archiveDir, `context.snapshot.md.${tsFile}`);
    expect(fs.existsSync(memDest)).toBe(true);
    expect(fs.existsSync(snapDest)).toBe(true);
    expect(fs.readFileSync(memDest, 'utf8')).toBe('mem');
    expect(fs.readFileSync(snapDest, 'utf8')).toBe('snap');
    expect(fs.existsSync(mem)).toBe(false);
    expect(fs.existsSync(snap)).toBe(false);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('restores files from backup', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memres-'));
    const mem = path.join(dir, 'memory.log');
    const snap = path.join(dir, 'context.snapshot.md');
    const memBak = path.join(dir, 'm.log');
    const snapBak = path.join(dir, 's.md');
    fs.writeFileSync(memBak, 'mem');
    fs.writeFileSync(snapBak, 'snap');

    process.env.MEM_PATH = mem;
    process.env.SNAPSHOT_PATH = snap;

    jest.isolateModules(() => {
      const utils = require('../../scripts/memory-utils');
      const { restoreMemory } = require('../../scripts/memory-cli');
      const map = { [utils.memPath]: mem, [utils.snapshotPath]: snap } as Record<string, string>;
      withFsMocks(map, () => {
        restoreMemory(memBak, 'memory');
        restoreMemory(snapBak, 'snapshot');
      });
    });

    expect(fs.readFileSync(mem, 'utf8')).toBe('mem');
    expect(fs.readFileSync(snap, 'utf8')).toBe('snap');
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
