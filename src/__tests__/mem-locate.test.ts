import fs from 'fs';
import os from 'os';
import path from 'path';
import { memPath, snapshotPath } from '../../scripts/memory-utils';

function withFsMocks(paths: Record<string, string>, fn: () => void) {
  const existsMock = jest.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
    if (paths[p as string]) return fs.existsSync(paths[p as string]);
    return fs.existsSync(p as string);
  });
  const readMock = jest
    .spyOn(fs, 'readFileSync')
    .mockImplementation((p: any, opt?: any) => {
      if (paths[p as string]) p = paths[p as string];
      return fs.readFileSync(p as string, opt);
    });
  try {
    fn();
  } finally {
    existsMock.mockRestore();
    readMock.mockRestore();
  }
}

const block1 =
  '### 2025-01-01 00:00 UTC | mem-001\n' +
  '- Commit SHA: abc123\n' +
  '- Summary: first\n' +
  '- Next Goal: a\n';

const block2 =
  '### 2025-01-02 00:00 UTC | mem-002\n' +
  '- Commit SHA: def456\n' +
  '- Summary: second\n' +
  '- Next Goal: b\n';

describe('mem-locate', () => {
  it('prints block for commit hash', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'locate-'));
    const mem = path.join(dir, 'memory.log');
    const snap = path.join(dir, 'context.snapshot.md');
    fs.writeFileSync(mem, 'abc123 | note | file | 2025-01-01T00:00:00Z\n');
    fs.writeFileSync(snap, block1 + block2);

    const map = { [memPath]: mem, [snapshotPath]: snap };
    const logMock = jest.spyOn(console, 'log').mockImplementation(() => {});

    withFsMocks(map, () => {
      jest.isolateModules(() => {
        process.argv = ['node', 'mem-locate.ts', 'abc123'];
        require('../../scripts/mem-locate.ts');
      });
    });

    const out = logMock.mock.calls.map((c) => c[0]).join('\n');
    expect(out).toContain('mem-001');
    expect(out).toContain('Commit SHA: abc123');

    logMock.mockRestore();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('prints block for mem-id', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'locate-'));
    const mem = path.join(dir, 'memory.log');
    const snap = path.join(dir, 'context.snapshot.md');
    fs.writeFileSync(mem, 'def456 | note | file | 2025-01-02T00:00:00Z\n');
    fs.writeFileSync(snap, block1 + block2);

    const map = { [memPath]: mem, [snapshotPath]: snap };
    const logMock = jest.spyOn(console, 'log').mockImplementation(() => {});

    withFsMocks(map, () => {
      jest.isolateModules(() => {
        process.argv = ['node', 'mem-locate.ts', 'mem-002'];
        require('../../scripts/mem-locate.ts');
      });
    });

    const out = logMock.mock.calls.map((c) => c[0]).join('\n');
    expect(out).toContain('mem-002');
    expect(out).toContain('Commit SHA: def456');

    logMock.mockRestore();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('prints nothing when not found', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'locate-'));
    const mem = path.join(dir, 'memory.log');
    const snap = path.join(dir, 'context.snapshot.md');
    fs.writeFileSync(mem, 'abc123 | note | file | 2025-01-01T00:00:00Z\n');
    fs.writeFileSync(snap, block1);

    const map = { [memPath]: mem, [snapshotPath]: snap };
    const logMock = jest.spyOn(console, 'log').mockImplementation(() => {});

    withFsMocks(map, () => {
      jest.isolateModules(() => {
        process.argv = ['node', 'mem-locate.ts', 'def456'];
        require('../../scripts/mem-locate.ts');
      });
    });

    expect(logMock).not.toHaveBeenCalled();

    logMock.mockRestore();
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

