import path from 'path';
import * as cp from 'child_process';
import { repoRoot } from '../../scripts/memory-utils';

const scriptDir = path.resolve(__dirname, '../../scripts');

function run(args: string[]) {
  const orig = process.argv;
  process.argv = ['node', 'memory-cli.ts', ...args];
  jest.isolateModules(() => {
    require('../../scripts/memory-cli.ts');
  });
  process.argv = orig;
}

describe('memory-cli', () => {
  let spy: jest.SpyInstance;

  beforeEach(() => {
    spy = jest.spyOn(cp, 'spawnSync').mockReturnValue({ status: 0 } as any);
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('runs mem-diff for diff command', () => {
    run(['diff']);
    expect(spy).toHaveBeenCalledWith(
      'ts-node',
      [path.join(scriptDir, 'mem-diff.ts')],
      { stdio: 'inherit', cwd: repoRoot }
    );
  });

  it('runs memory-json for json command', () => {
    run(['json']);
    expect(spy).toHaveBeenCalledWith(
      'ts-node',
      [path.join(scriptDir, 'memory-json.ts')],
      { stdio: 'inherit', cwd: repoRoot }
    );
  });

  it('runs clean-locks for clean-locks command', () => {
    run(['clean-locks']);
    expect(spy).toHaveBeenCalledWith(
      'ts-node',
      [path.join(scriptDir, 'clean-locks.ts')],
      { stdio: 'inherit', cwd: repoRoot }
    );
  });

  it('runs memory-check for check command', () => {
    run(['check']);
    expect(spy).toHaveBeenCalledWith(
      'ts-node',
      [path.join(scriptDir, 'memory-check.ts')],
      { stdio: 'inherit', cwd: repoRoot }
    );
  });
});
