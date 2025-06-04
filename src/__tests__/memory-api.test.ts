import fs from 'fs'
import os from 'os'
import path from 'path'
import { parseMemoryLines } from '../../scripts/memory-utils'

describe('memory api route', () => {
  it('returns parsed memory entries', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memapi-'))
    const mem = path.join(dir, 'memory.log')
    const lines = [
      'abc123 | first commit | a.ts | 2025-01-01T00:00:00Z',
      'def456 | Task 2 | desc | b.ts | 2025-01-02T00:00:00Z',
    ]
    fs.writeFileSync(mem, lines.join('\n'))
    process.env.MEM_PATH = mem
    let mod: any
    jest.isolateModules(() => {
      mod = require('../app/api/memory/route')
    })
    const res = await mod.GET()
    const json = await res.json()
    expect(json).toEqual(parseMemoryLines(lines))
    delete process.env.MEM_PATH
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('returns empty array when file missing', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memapi-'))
    const mem = path.join(dir, 'missing.log')
    process.env.MEM_PATH = mem
    let mod: any
    jest.isolateModules(() => {
      mod = require('../app/api/memory/route')
    })
    const res = await mod.GET()
    const json = await res.json()
    expect(json).toEqual([])
    delete process.env.MEM_PATH
    fs.rmSync(dir, { recursive: true, force: true })
  })
})
