import fs from 'fs'
import os from 'os'
import path from 'path'
import * as cp from 'child_process'
import { memPath, repoRoot } from '../../scripts/memory-utils'
import * as utils from '../../scripts/memory-utils'

describe('mem-sync', () => {
  it('merges logs from branch', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memsync-'))
    const memFile = path.join(dir, 'memory.log')
    fs.writeFileSync(memFile, 'b1 | B | x | 2025-01-02T00:00:00Z\n')
    const otherLines = 'a1 | A | y | 2025-01-01T00:00:00Z\n'
    const exec = jest
      .spyOn(cp, 'execSync')
      .mockReturnValue(otherLines as any)
    const read = jest
      .spyOn(utils, 'readMemoryLines')
      .mockReturnValue(['b1 | B | x | 2025-01-02T00:00:00Z'])
    const atomic = jest.spyOn(utils, 'atomicWrite').mockImplementation(() => {})
    const lock = jest
      .spyOn(utils, 'withFileLock')
      .mockImplementation((_, fn) => fn())
    jest.isolateModules(() => {
      process.argv = ['node', 'mem-sync.ts', 'other']
      require('../../scripts/mem-sync.ts')
    })
    expect(exec).toHaveBeenCalledWith('git show other:memory.log', {
      cwd: repoRoot,
      encoding: 'utf8',
    })
    const expected = 'a1 | A | y | 2025-01-01T00:00:00Z\nb1 | B | x | 2025-01-02T00:00:00Z\n'
    expect(lock).toHaveBeenCalledWith(memPath, expect.any(Function))
    expect(atomic).toHaveBeenCalledWith(memPath, expected)

    exec.mockRestore()
    read.mockRestore()
    atomic.mockRestore()
    lock.mockRestore()
    fs.rmSync(dir, { recursive: true, force: true })
  })
})
