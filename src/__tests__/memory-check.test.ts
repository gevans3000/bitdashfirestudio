import fs from 'fs';
import os from 'os';
import path from 'path';
import * as cp from 'child_process';
import * as utils from '../../scripts/memory-utils';

const { memPath, snapshotPath } = utils;

function withFsMocks(paths: Record<string, string>, fn: () => void) {
  const existsMock = jest.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
    if (paths[p as string]) return fs.existsSync(paths[p as string]);
    return fs.existsSync(p);
  });
  const readMock = jest.spyOn(fs, 'readFileSync').mockImplementation((p: any, o?: any) => {
    if (paths[p as string]) p = paths[p as string];
    return fs.readFileSync(p, o);
  });
  try {
    fn();
  } finally {
    existsMock.mockRestore();
    readMock.mockRestore();
  }
}

describe('memory-check', () => {
  it('passes for ordered log', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memchk-'));
    const tmpMem = path.join(tmpDir, 'memory.log');
    const tmpSnap = path.join(tmpDir, 'context.snapshot.md');
    fs.writeFileSync(
      tmpMem,
      'a1b2c3 | test | file | 2025-01-01T00:00:00Z\n' +
        'b2c3d4 | test | file | 2025-01-01T01:00:00Z\n'
    );
    fs.writeFileSync(
      tmpSnap,
      '### 2025-01-01 00:00 UTC | mem-001\n' +
        '- Commit SHA: a1b2c3\n' +
        '### 2025-01-01 01:00 UTC | mem-002\n' +
        '- Commit SHA: b2c3d4\n'
    );
    const execMock = jest
      .spyOn(cp, 'execSync')
      .mockImplementation((cmd: string) => {
        if (cmd.includes('git log -1 --pretty=%s')) return Buffer.from('test');
        return Buffer.from('');
      });
    const logMock = jest.spyOn(console, 'log').mockImplementation(() => {});

    withFsMocks({ [memPath]: tmpMem, [snapshotPath]: tmpSnap }, () => {
      jest.isolateModules(() => {
        require('../../scripts/memory-check.ts');
      });
    });

    expect(logMock).toHaveBeenCalledWith('Memory check passed');
    execMock.mockRestore();
    logMock.mockRestore();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('fails for unordered log', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memchk-'));
    const tmpMem = path.join(tmpDir, 'memory.log');
    const tmpSnap = path.join(tmpDir, 'context.snapshot.md');
    fs.writeFileSync(
      tmpMem,
      'a1b2c3 | test | file | 2025-01-01T01:00:00Z\n' +
        'b2c3d4 | test | file | 2025-01-01T00:00:00Z\n'
    );
    fs.writeFileSync(
      tmpSnap,
      '### 2025-01-01 00:00 UTC | mem-001\n' +
        '- Commit SHA: a1b2c3\n' +
        '### 2025-01-01 01:00 UTC | mem-002\n' +
        '- Commit SHA: b2c3d4\n'
    );
    const execMock = jest
      .spyOn(cp, 'execSync')
      .mockImplementation((cmd: string) => {
        if (cmd.includes('git log -1 --pretty=%s')) return Buffer.from('test');
        return Buffer.from('');
      });
    const errMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitMock = jest
      .spyOn(process, 'exit')
      .mockImplementation(((code?: number) => {
        throw new Error(String(code));
      }) as any);

    expect(() => {
      withFsMocks({ [memPath]: tmpMem, [snapshotPath]: tmpSnap }, () => {
        jest.isolateModules(() => {
          require('../../scripts/memory-check.ts');
        });
      });
    }).toThrow('1');

    execMock.mockRestore();
    errMock.mockRestore();
    exitMock.mockRestore();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('fails for missing mem-id', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memchk-'));
    const tmpMem = path.join(tmpDir, 'memory.log');
    const tmpSnap = path.join(tmpDir, 'context.snapshot.md');
    fs.writeFileSync(
      tmpMem,
      'a1b2c3 | test | file | 2025-01-01T00:00:00Z\n' +
        'b2c3d4 | test | file | 2025-01-01T01:00:00Z\n'
    );
    fs.writeFileSync(
      tmpSnap,
      '### 2025-01-01 00:00 UTC | mem-001\n' +
        '- Commit SHA: a1b2c3\n' +
        '### 2025-01-01 01:00 UTC | mem-003\n' +
        '- Commit SHA: b2c3d4\n'
    );
    const execMock = jest
      .spyOn(cp, 'execSync')
      .mockImplementation((cmd: string) => {
        if (cmd.includes('git log -1 --pretty=%s')) return Buffer.from('test');
        return Buffer.from('');
      });
    const errMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitMock = jest
      .spyOn(process, 'exit')
      .mockImplementation(((code?: number) => {
        throw new Error(String(code));
      }) as any);

    expect(() => {
      withFsMocks({ [memPath]: tmpMem, [snapshotPath]: tmpSnap }, () => {
        jest.isolateModules(() => {
          require('../../scripts/memory-check.ts');
        });
      });
    }).toThrow('1');

    execMock.mockRestore();
    errMock.mockRestore();
    exitMock.mockRestore();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('fails for mismatched summary', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memchk-'));
    const tmpMem = path.join(tmpDir, 'memory.log');
    const tmpSnap = path.join(tmpDir, 'context.snapshot.md');
    fs.writeFileSync(tmpMem, 'a1b2c3 | wrong | file | 2025-01-01T00:00:00Z\n');
    fs.writeFileSync(
      tmpSnap,
      '### 2025-01-01 00:00 UTC | mem-001\n' + '- Commit SHA: a1b2c3\n'
    );
    const execMock = jest
      .spyOn(cp, 'execSync')
      .mockImplementation((cmd: string) => {
        if (cmd.includes('git log -1 --pretty=%s')) return Buffer.from('correct');
        return Buffer.from('');
      });
    const errMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitMock = jest
      .spyOn(process, 'exit')
      .mockImplementation(((code?: number) => {
        throw new Error(String(code));
      }) as any);

    expect(() => {
      withFsMocks({ [memPath]: tmpMem, [snapshotPath]: tmpSnap }, () => {
        jest.isolateModules(() => {
          require('../../scripts/memory-check.ts');
        });
      });
    }).toThrow('1');

    execMock.mockRestore();
    errMock.mockRestore();
    exitMock.mockRestore();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
