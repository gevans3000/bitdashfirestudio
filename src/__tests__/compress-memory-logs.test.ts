import fs from 'fs';
import os from 'os';
import path from 'path';

function run(dir: string, args: string[] = []) {
  jest.doMock('../../scripts/memory-utils', () => {
    const actual = jest.requireActual('../../scripts/memory-utils');
    return { ...actual, repoRoot: dir };
  });
  jest.isolateModules(() => {
    const orig = process.argv;
    process.argv = ['node', 'compress-memory-logs.ts', ...args];
    require('../../scripts/compress-memory-logs.ts');
    process.argv = orig;
  });
  jest.dontMock('../../scripts/memory-utils');
}

describe('compress-memory-logs', () => {
  it('gzips old backups without removing originals', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arch-'));
    const logs = path.join(dir, 'logs');
    fs.mkdirSync(logs);
    const old = Date.now() - 8 * 24 * 60 * 60 * 1000;
    const mem = path.join(logs, 'memory.log.old.bak');
    const snap = path.join(logs, 'context.snapshot.old.bak');
    fs.writeFileSync(mem, 'a');
    fs.writeFileSync(snap, 'b');
    const d = new Date(old);
    fs.utimesSync(mem, d, d);
    fs.utimesSync(snap, d, d);

    run(dir);

    expect(fs.existsSync(mem + '.gz')).toBe(true);
    expect(fs.existsSync(snap + '.gz')).toBe(true);
    expect(fs.existsSync(mem)).toBe(true);
    expect(fs.existsSync(snap)).toBe(true);

    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('removes originals when --remove flag used', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arch-'));
    const logs = path.join(dir, 'logs');
    fs.mkdirSync(logs);
    const old = Date.now() - 8 * 24 * 60 * 60 * 1000;
    const mem = path.join(logs, 'memory.log.old.bak');
    fs.writeFileSync(mem, 'a');
    const d = new Date(old);
    fs.utimesSync(mem, d, d);

    run(dir, ['--remove']);

    expect(fs.existsSync(mem + '.gz')).toBe(true);
    expect(fs.existsSync(mem)).toBe(false);

    fs.rmSync(dir, { recursive: true, force: true });
  });
});
