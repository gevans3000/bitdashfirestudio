import fs from 'fs';
import path from 'path';
import * as cp from 'child_process';
import { repoRoot } from '../../scripts/memory-utils';

function runHook() {
  const hookPath = path.join(repoRoot, '.husky/pre-commit');
  const lines = fs.readFileSync(hookPath, 'utf8').split('\n');
  const cmd = lines.find((l) => l.startsWith('npm'));
  if (cmd) {
    cp.spawnSync(cmd, { shell: true });
  }
}

describe('pre-commit hook', () => {
  it('invokes npm run mem-check', () => {
    const spy = jest
      .spyOn(cp, 'spawnSync')
      .mockReturnValue({ status: 0 } as any);
    runHook();
    expect(spy).toHaveBeenCalled();
    const joined = spy.mock.calls.map((c) => c[0]).join(' ');
    expect(joined).toContain('npm run mem-check');
    spy.mockRestore();
  });
});
