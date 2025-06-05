import fs from 'fs';
import os from 'os';
import path from 'path';
import { memPath, snapshotPath } from '../../scripts/memory-utils';

function withFsMocks(paths: Record<string, string>, fn: () => void) {
  const origExists = fs.existsSync;
  const origRead = fs.readFileSync;
  const existsMock = jest.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
    if (paths[p as string]) return origExists.call(fs, paths[p as string]);
    return origExists.call(fs, p as string);
  });
  const readMock = jest
    .spyOn(fs, 'readFileSync')
    .mockImplementation((p: any, opt?: any) => {
      if (paths[p as string]) p = paths[p as string];
      return origRead.call(fs, p as string, opt);
    });
  try {
    fn();
  } finally {
    existsMock.mockRestore();
    readMock.mockRestore();
  }
}

describe('memgrep', () => {
  it('prints matching lines with ids or hashes', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'grep-'));
    const tmpMem = path.join(dir, 'memory.log');
    const tmpSnap = path.join(dir, 'context.snapshot.md');
    fs.writeFileSync(
      tmpMem,
      'abc123 | fix bug | file | 2025-01-01T00:00:00Z\n' +
        'def456 | add feature | file | 2025-01-02T00:00:00Z\n'
    );
    fs.writeFileSync(
      tmpSnap,
      '### 2025-01-01 00:00 UTC | mem-001\n' +
        'minor fix details\n' +
        '### 2025-01-02 00:00 UTC | mem-002\n' +
        'other info\n'
    );

    const logMock = jest.spyOn(console, 'log').mockImplementation(() => {});

    withFsMocks({ [memPath]: tmpMem, [snapshotPath]: tmpSnap }, () => {
      jest.isolateModules(() => {
        process.argv = ['node', 'memgrep.ts', 'fix'];
        require('../../scripts/memgrep.ts');
      });
    });

    const outputs = logMock.mock.calls.map((c) => c[0]);
    expect(outputs).toContain(expect.stringContaining('abc123:'));
    expect(outputs).toContain('mem-001: minor fix details');
    expect(outputs.some((o) => /def456/.test(o))).toBe(false);
    expect(outputs.some((o) => /mem-002/.test(o))).toBe(false);

    logMock.mockRestore();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('prints nothing when no match found', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'grep-'));
    const tmpMem = path.join(dir, 'memory.log');
    const tmpSnap = path.join(dir, 'context.snapshot.md');
    fs.writeFileSync(tmpMem, 'abc123 | test | file | 2025-01-01T00:00:00Z\n');
    fs.writeFileSync(tmpSnap, '### 2025-01-01 | mem-001\ntext\n');

    const logMock = jest.spyOn(console, 'log').mockImplementation(() => {});

    withFsMocks({ [memPath]: tmpMem, [snapshotPath]: tmpSnap }, () => {
      jest.isolateModules(() => {
        process.argv = ['node', 'memgrep.ts', 'nomatch'];
        require('../../scripts/memgrep.ts');
      });
    });

    expect(logMock).not.toHaveBeenCalled();

    logMock.mockRestore();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('respects --since and --until range', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'grep-'));
    const tmpMem = path.join(dir, 'memory.log');
    const tmpSnap = path.join(dir, 'context.snapshot.md');
    fs.writeFileSync(
      tmpMem,
      'aaa111 | fix early | file | 2025-01-01T00:00:00Z\n' +
        'bbb222 | fix late | file | 2025-01-03T00:00:00Z\n'
    );
    fs.writeFileSync(
      tmpSnap,
      '### 2025-01-01 00:00 UTC | mem-010\n' +
        'early note\n' +
        '### 2025-01-03 00:00 UTC | mem-011\n' +
        'late note\n'
    );

    const logMock = jest.spyOn(console, 'log').mockImplementation(() => {});

    withFsMocks({ [memPath]: tmpMem, [snapshotPath]: tmpSnap }, () => {
      jest.isolateModules(() => {
        process.argv = [
          'node',
          'memgrep.ts',
          'fix',
          '--since',
          '2025-01-02T00:00:00Z',
          '--until',
          '2025-01-04T00:00:00Z',
        ];
        require('../../scripts/memgrep.ts');
      });
    });

    const outputs = logMock.mock.calls.map((c) => c[0]);
    expect(outputs).toContain(expect.stringContaining('bbb222:'));
    expect(outputs).toContain('mem-011: late note');
    expect(outputs.some((o) => /aaa111/.test(o))).toBe(false);
    expect(outputs.some((o) => /mem-010/.test(o))).toBe(false);

    logMock.mockRestore();
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
