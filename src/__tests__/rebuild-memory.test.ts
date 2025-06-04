import fs from 'fs';
import os from 'os';
import path from 'path';
import * as cp from 'child_process';

const script = path.join(__dirname, '../../scripts/rebuild-memory.ts');

describe('rebuild-memory', () => {
  it('writes commit history to memory.log', () => {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'rebuild-'));
    cp.execSync('git init', { cwd: repo });
    fs.writeFileSync(path.join(repo, 'a.txt'), 'a');
    cp.execSync('git add a.txt', { cwd: repo });
    cp.execSync('git commit -m "first"', { cwd: repo });
    fs.writeFileSync(path.join(repo, 'b.txt'), 'b');
    cp.execSync('git add b.txt', { cwd: repo });
    cp.execSync('git commit -m "second"', { cwd: repo });

    const origExec = cp.execSync;
    const execMock = jest.spyOn(cp, 'execSync').mockImplementation((cmd: string, opts?: any) => {
      if (cmd.startsWith('ts-node') && cmd.includes('append-memory.ts')) {
        return Buffer.from('');
      }
      return origExec(cmd, opts);
    });

    jest.isolateModules(() => {
      process.argv = ['node', script, repo];
      require('../../scripts/rebuild-memory.ts');
    });

    execMock.mockRestore();
    const out = fs.readFileSync(path.join(repo, 'memory.log'), 'utf8').trim().split('\n');
    expect(out.length).toBe(2);
    expect(out[0]).toMatch(/first/);
    expect(out[1]).toMatch(/second/);
    fs.rmSync(repo, { recursive: true, force: true });
  });
});
