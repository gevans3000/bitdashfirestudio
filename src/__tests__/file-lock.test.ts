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
      atomicWrite(file, cur + ch);
    });
  `;
  const scriptPath = path.join(os.tmpdir(), `lock-${char}.js`);
  fs.writeFileSync(scriptPath, script);
  return spawn('node', ['-r', 'ts-node/register', scriptPath, file, char, delay], {
    cwd: repoRoot,
  });
}

describe('withFileLock', () => {
  it('serializes concurrent writes', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'locktest-'));
    const file = path.join(dir, 'mem.txt');
    const p1 = run(file, 'A', '100');
    const p2 = run(file, 'B', '0');

    await Promise.all([
      new Promise((res) => p1.on('exit', res)),
      new Promise((res) => p2.on('exit', res)),
    ]);

    const out = fs.readFileSync(file, 'utf8');
    const sorted = out.split('').sort().join('');
    expect(sorted).toBe('AB');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('removes stale lock files', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'locktest-'));
    const file = path.join(dir, 'mem.txt');
    const lock = `${file}.lock`;
    fs.writeFileSync(lock, '');
    const past = new Date(Date.now() - 61_000);
    fs.utimesSync(lock, past, past);

    const { withFileLock, atomicWrite } = require('../../scripts/memory-utils');
    withFileLock(file, () => {
      atomicWrite(file, 'X');
    });

    expect(fs.readFileSync(file, 'utf8')).toBe('X');
    expect(fs.existsSync(lock)).toBe(false);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('cleans lock after successful write', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'locktest-'));
    const file = path.join(dir, 'mem.txt');
    const { withFileLock, atomicWrite } = require('../../scripts/memory-utils');
    withFileLock(file, () => {
      atomicWrite(file, 'Y');
    });
    expect(fs.readFileSync(file, 'utf8')).toBe('Y');
    expect(fs.existsSync(`${file}.lock`)).toBe(false);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('handles many concurrent writers', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'locktest-'));
    const file = path.join(dir, 'mem.txt');
    const p1 = run(file, 'A', '200');
    const p2 = run(file, 'B', '100');
    const p3 = run(file, 'C', '0');

    await Promise.all([
      new Promise((res) => p1.on('exit', res)),
      new Promise((res) => p2.on('exit', res)),
      new Promise((res) => p3.on('exit', res)),
    ]);

    const out = fs.readFileSync(file, 'utf8');
    const sorted = out.split('').sort().join('');
    expect(sorted).toBe('ABC');
    expect(fs.existsSync(`${file}.lock`)).toBe(false);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
