import path from 'path';
import * as utils from '../../scripts/memory-utils';

const { repoRoot } = utils;

describe('memory-json', () => {
  it('writes memory.json using atomicWrite with lock', () => {
    const lines = [
      'abc123 | Task 1 | add feature | a.ts, b.ts | 2025-01-01T00:00:00Z',
      'def456 | fix bug | c.ts | 2025-01-02T00:00:00Z',
    ];
    const readMock = jest
      .spyOn(utils, 'readMemoryLines')
      .mockReturnValue(lines);
    const atomicMock = jest
      .spyOn(utils, 'atomicWrite')
      .mockImplementation(() => {});
    const lockMock = jest
      .spyOn(utils, 'withFileLock')
      .mockImplementation((_, fn) => {
        fn();
      });
    const logMock = jest.spyOn(console, 'log').mockImplementation(() => {});

    jest.isolateModules(() => {
      require('../../scripts/memory-json.ts');
    });

    const outPath = path.join(repoRoot, 'memory.json');
    const expected =
      JSON.stringify(
        [
          {
            hash: 'abc123',
            summary: 'add feature',
            files: ['a.ts', 'b.ts'],
            timestamp: '2025-01-01T00:00:00Z',
          },
          {
            hash: 'def456',
            summary: 'fix bug',
            files: ['c.ts'],
            timestamp: '2025-01-02T00:00:00Z',
          },
        ],
        null,
        2,
      ) + '\n';

    expect(lockMock).toHaveBeenCalledWith(outPath, expect.any(Function));
    expect(atomicMock).toHaveBeenCalledWith(outPath, expected);

    readMock.mockRestore();
    atomicMock.mockRestore();
    lockMock.mockRestore();
    logMock.mockRestore();
  });
});
