import fs from 'fs'
import os from 'os'
import path from 'path'
import { memPath } from '../../scripts/memory-utils'

function withFs(pathMap: Record<string, string>, fn: () => void) {
  const read = jest.spyOn(fs, 'readFileSync').mockImplementation((p: any, o?: any) => {
    if (pathMap[p as string]) p = pathMap[p as string]
    return fs.readFileSync(p, o)
  })
  const exists = jest.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
    if (pathMap[p as string]) p = pathMap[p as string]
    return fs.existsSync(p)
  })
  try {
    fn()
  } finally {
    read.mockRestore()
    exists.mockRestore()
  }
}

describe('mem-list', () => {
  it('prints last n entries', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memlist-'))
    const memFile = path.join(dir, 'memory.log')
    const lines = ['a', 'b', 'c']
    fs.writeFileSync(memFile, lines.join('\n'))
    const log = jest.spyOn(console, 'log').mockImplementation(() => {})
    withFs({ [memPath]: memFile }, () => {
      const orig = process.argv
      process.argv = ['node', 'memory-cli.ts', 'list', '-n', '2']
      jest.isolateModules(() => {
        require('../../scripts/memory-cli.ts')
      })
      process.argv = orig
    })
    expect(log).toHaveBeenNthCalledWith(1, 'b')
    expect(log).toHaveBeenNthCalledWith(2, 'c')
    log.mockRestore()
    fs.rmSync(dir, { recursive: true, force: true })
  })
})
