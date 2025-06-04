import fs from 'fs';
import os from 'os';
import path from 'path';
import * as cp from 'child_process';
import * as utils from '../../scripts/memory-utils';

const { snapshotPath } = utils;

function withFsMocks(
  paths: Record<string, string>,
  openCalls: string[],
  renameCalls: string[][],
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
      renameCalls.push([a as string, b as string]);
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

describe('update-snapshot', () => {
  it('calls append-memory with locking and atomic write', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'snapupd-'));
    const snap = path.join(dir, 'context.snapshot.md');
    fs.writeFileSync(snap, '');

    const openCalls: string[] = [];
    const renameCalls: string[][] = [];
    const unlinkCalls: string[] = [];
    const map = { [snapshotPath]: snap } as Record<string, string>;

    const summary = 'Test summary';
    const nextTask = 'Next task';

    withFsMocks(map, openCalls, renameCalls, unlinkCalls, () => {
      const execMock = jest
        .spyOn(cp, 'execSync')
        .mockImplementation((cmd: string) => {
          if (cmd.startsWith('git log -1')) return Buffer.from(summary);
          if (cmd.startsWith("grep -m 1")) return Buffer.from(nextTask);
          if (cmd.startsWith('ts-node') && cmd.includes('append-memory.ts')) {
            const m = cmd.match(/append-memory\.ts\s+(.*)\s+(.*)$/);
            const arg1 = JSON.parse(m![1]);
            const arg2 = JSON.parse(m![2]);
            jest.isolateModules(() => {
              const orig = process.argv;
              process.argv = ['node', 'append-memory.ts', arg1, arg2];
              require('../../scripts/append-memory.ts');
              process.argv = orig;
            });
            return Buffer.from('');
          }
          if (cmd.startsWith('git rev-parse')) return Buffer.from('abc123');
          return Buffer.from('');
        });

      jest.isolateModules(() => {
        require('../../scripts/update-snapshot.ts');
      });

      execMock.mockRestore();
    });

    expect(openCalls).toContain(`${snap}.lock`);
    expect(unlinkCalls).toContain(`${snap}.lock`);
    const renamed = renameCalls.find((c) => c[1] === snap);
    expect(renamed).toBeDefined();

    const out = fs.readFileSync(snap, 'utf8');
    expect(out).toContain(summary);
    expect(out).toContain(nextTask);

    fs.rmSync(dir, { recursive: true, force: true });
  });
});
