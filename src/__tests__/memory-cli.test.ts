const mockCheck = jest.fn();
jest.mock('../../scripts/memory-check.ts', () => {
  mockCheck();
  return {};
});

import * as cli from '../../scripts/memory-cli';

function run(args: string[]) {
  const orig = process.argv;
  process.argv = ['node', 'memory-cli.ts', ...args];
  jest.isolateModules(() => {
    cli.main();
  });
  process.argv = orig;
}

describe('memory-cli', () => {
  afterEach(() => jest.restoreAllMocks());

  it('runs mem-diff for diff command', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const diffSpy = jest.spyOn(cli, 'memDiff').mockImplementation(() => {});
    run(['diff']);
    expect(diffSpy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('runs memory-json for json command', () => {
    const jsonSpy = jest.spyOn(cli, 'memoryJson').mockImplementation(() => {});
    run(['json']);
    expect(jsonSpy).toHaveBeenCalled();
  });

  it('runs clean-locks for clean-locks command', () => {
    const clSpy = jest.spyOn(cli, 'cleanLocks').mockImplementation(() => {});
    run(['clean-locks']);
    expect(clSpy).toHaveBeenCalled();
  });

  it('runs memory-check for check command', () => {
    run(['check']);
    expect(mockCheck).toHaveBeenCalled();
  });

  it('runs rebuild-memory for rebuild command', () => {
    const rebuildSpy = jest.spyOn(cli, 'rebuildMemory').mockImplementation(() => {});
    run(['rebuild']);
    expect(rebuildSpy).toHaveBeenCalled();
  });

  it('runs update-snapshot for snapshot-update command', () => {
    const snapSpy = jest.spyOn(cli, 'snapshotUpdate').mockImplementation(() => {});
    run(['snapshot-update']);
    expect(snapSpy).toHaveBeenCalled();
  });

  it('runs mem-list for list command', () => {
    const listSpy = jest.spyOn(cli, 'memList').mockImplementation(() => {});
    run(['list']);
    expect(listSpy).toHaveBeenCalled();
  });
});
