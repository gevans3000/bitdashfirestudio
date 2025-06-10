import * as cp from 'child_process';
import * as utils from '../../scripts/memory-utils';
import { memDiff } from '../../scripts/memory-cli';

describe('mem-diff', () => {
  it('prints hashes missing from memory.log', () => {
    const readMock = jest
      .spyOn(utils, 'readMemoryLines')
      .mockReturnValue(['abc123 | test | file | 2025-01-01']);
    const execMock = jest
      .spyOn(cp, 'execSync')
      .mockReturnValue(Buffer.from('def456\nabc123\n'));
    const logMock = jest.spyOn(console, 'log').mockImplementation(() => {});

    jest.isolateModules(() => {
      memDiff();
    });

    expect(logMock).toHaveBeenCalledWith('def456');

    readMock.mockRestore();
    execMock.mockRestore();
    logMock.mockRestore();
  });

  it('prints success message when all hashes present', () => {
    const readMock = jest
      .spyOn(utils, 'readMemoryLines')
      .mockReturnValue([
        'abc123 | test | file | 2025-01-01',
        'def456 | another | file | 2025-01-02',
      ]);
    const execMock = jest
      .spyOn(cp, 'execSync')
      .mockReturnValue(Buffer.from('def456\nabc123\n'));
    const logMock = jest.spyOn(console, 'log').mockImplementation(() => {});

    jest.isolateModules(() => {
      memDiff();
    });

    expect(logMock).toHaveBeenCalledWith('All commits present in memory.log');

    readMock.mockRestore();
    execMock.mockRestore();
    logMock.mockRestore();
  });
});
