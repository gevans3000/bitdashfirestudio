import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { repoRoot } from '../../scripts/memory-utils';

function run(snapshot: string, summary: string, delay: string) {
  const script = `
    const { spawnSync } = require('child_process');
    const path = require('path');
    const delay = parseInt(process.argv[4] || '0', 10);
    const env = { ...process.env, SNAPSHOT_PATH: process.argv[2] };
    if (delay) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay);
    spawnSync('node', ['-r', 'ts-node/register', path.join('${repoRoot.replace(/\\/g, '\\\\')}', 'scripts/append-memory.ts'), process.argv[3], 'next'], { env, cwd: '${repoRoot}', stdio: 'inherit' });
  `;
  const tmpScript = path.join(os.tmpdir(), `append-${summary}.js`);
  fs.writeFileSync(tmpScript, script);
  return spawn('node', [tmpScript, snapshot, summary, delay], { cwd: repoRoot });
}

describe('append-memory concurrency', () => {
  it('serializes concurrent snapshot writes', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'append-'));
    const snap = path.join(dir, 'context.snapshot.md');
    const p1 = run(snap, 'A', '100');
    const p2 = run(snap, 'B', '0');

    await Promise.all([
      new Promise((res) => p1.on('exit', res)),
      new Promise((res) => p2.on('exit', res)),
    ]);

    const out = fs.readFileSync(snap, 'utf8');
    const sections = out.match(/mem-\d+/g) || [];
    expect(sections.length).toBe(2);
    const sorted = [...new Set(sections)].sort();
    expect(sorted).toEqual(['mem-001', 'mem-002']);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
