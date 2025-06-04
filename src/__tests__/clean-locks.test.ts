import fs from 'fs';
import os from 'os';
import path from 'path';
import { cleanLocks } from '../../scripts/clean-locks';

const TTL = 300_000; // 5 minutes

describe('cleanLocks', () => {
  it('removes stale lock files', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'locks-'));
    const oldLock = path.join(dir, 'old.lock');
    const newLock = path.join(dir, 'new.lock');
    fs.writeFileSync(oldLock, '');
    fs.writeFileSync(newLock, '');

    const past = new Date(Date.now() - TTL - 1000);
    fs.utimesSync(oldLock, past, past);

    cleanLocks(dir, TTL);

    expect(fs.existsSync(oldLock)).toBe(false);
    expect(fs.existsSync(newLock)).toBe(true);

    fs.rmSync(dir, { recursive: true, force: true });
  });
});
