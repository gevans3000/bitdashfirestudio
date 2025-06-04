import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { repoRoot } from '../../scripts/memory-utils';

function run(file: string, char: string, delay: string) {
  const script = `
    const fs = require('fs');
    const { withFileLock, atomicWrite } = require('${path
      .join(repoRoot, 'scripts/memory-utils.ts')
      .replace(/\\/g, '\\\\')}');
    const file = process.argv[2];
    const ch = process.argv[3];
    const d = parseInt(process.argv[4] || '0', 10);
    withFileLock(file, () => {
      let cur = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
      if (d) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, d);
      atomicWrite(file, cur + ch + '\n');
    });
  `;
  const scriptPath = path.join(os.tmpdir(), `auto-${char}.js`);
  fs.writeFileSync(scriptPath, script);
  return spawn('node', ['-r', 'ts-node/register', scriptPath, file, char, delay], {
    cwd: repoRoot,
  });
}

describe('autoTaskRunner memory writes', () => {
  it('serializes concurrent invocations', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'autorun-'));
    const file = path.join(dir, 'mem.log');
    const p1 = run(file, 'A', '100');
    const p2 = run(file, 'B', '0');

    await Promise.all([
      new Promise((res) => p1.on('exit', res)),
      new Promise((res) => p2.on('exit', res)),
    ]);

    const lines = fs.readFileSync(file, 'utf8').trim().split('\n');
    const sorted = [...lines].sort().join('');
    expect(lines.length).toBe(2);
    expect(sorted).toBe('AB');
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
