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

  it('writes sequential mem-ids to snapshot', () => {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'rebuild-'));
    cp.execSync('git init', { cwd: repo });
    fs.writeFileSync(path.join(repo, 'a.txt'), 'a');
    cp.execSync('git add a.txt', { cwd: repo });
    cp.execSync('git commit -m "first"', { cwd: repo });
    fs.writeFileSync(path.join(repo, 'b.txt'), 'b');
    cp.execSync('git add b.txt', { cwd: repo });
    cp.execSync('git commit -m "second"', { cwd: repo });

    const snapshot = path.join(repo, 'context.snapshot.md');

    const origExec = cp.execSync;
    let count = 0;
    const execMock = jest
      .spyOn(cp, 'execSync')
      .mockImplementation((cmd: string, opts?: any) => {
        if (cmd.startsWith('ts-node') && cmd.includes('append-memory.ts')) {
          const sha = origExec('git rev-parse --short HEAD', {
            cwd: repo,
            encoding: 'utf8',
          })
            .toString()
            .trim();
          count++;
          const id = String(count).padStart(3, '0');
          fs.appendFileSync(snapshot, `### 0 | mem-${id}\n- Commit SHA: ${sha}\n`);
          return Buffer.from('');
        }
        return origExec(cmd, opts);
      });

    jest.isolateModules(() => {
      process.argv = ['node', script, repo];
      require('../../scripts/rebuild-memory.ts');
    });

    execMock.mockRestore();
    const memLines = fs
      .readFileSync(path.join(repo, 'memory.log'), 'utf8')
      .trim()
      .split('\n');
    const snapContent = fs.readFileSync(snapshot, 'utf8');
    const ids = memLines.map((line) => {
      const hash = line.split('|')[0].trim();
      const m = snapContent.match(new RegExp(`(mem-\\d+)[\\s\\S]*?Commit SHA: ${hash}`));
      return m ? m[1] : '';
    });
    const expected = memLines.map((_, i) => `mem-${String(i + 1).padStart(3, '0')}`);
    expect(ids).toEqual(expected);
    fs.rmSync(repo, { recursive: true, force: true });
  });
});
