import fs from 'fs'
import os from 'os'
import path from 'path'
import { main } from '../../scripts/memory-cli.ts'

describe('memory-cli', () => {
  it('lists archive and restore commands in help output', () => {
    const logs: string[] = []
    const origLog = console.log
    const origExit = process.exit
    ;(process.exit as any) = jest.fn()
    console.log = (msg?: any) => { logs.push(String(msg)) }
    main(['--help'])
    ;(process.exit as any) = origExit
    console.log = origLog
    const out = logs.join('\n')
    expect(out).toContain('archive')
    expect(out).toContain('restore <backup> <target>')
  })

  it('archives and restores memory files', () => {
    const origCwd = process.cwd()
    const origMem = process.env.MEM_PATH
    const origSnap = process.env.SNAPSHOT_PATH
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mem-test-'))
    const mem = path.join(tmp, 'memory.log')
    const snap = path.join(tmp, 'context.snapshot.md')
    fs.writeFileSync(mem, 'm')
    fs.writeFileSync(snap, 's')
    process.chdir(tmp)
    process.env.MEM_PATH = mem
    process.env.SNAPSHOT_PATH = snap

    jest.isolateModules(() => {
      const { main } = require('../../scripts/memory-cli.ts')
      main(['archive'])
    })

    const archiveDir = path.join(tmp, 'logs', 'archive')
    const files = fs.readdirSync(archiveDir)
    const memBak = files.find((f) => f.startsWith('memory.log.')) as string
    const snapBak = files.find((f) => f.startsWith('context.snapshot.md.')) as string
    expect(memBak).toBeDefined()
    expect(snapBak).toBeDefined()
    expect(fs.existsSync(mem)).toBe(false)
    expect(fs.existsSync(snap)).toBe(false)

    jest.isolateModules(() => {
      const { main } = require('../../scripts/memory-cli.ts')
      main(['restore', path.join(archiveDir, memBak), 'memory'])
    })
    jest.isolateModules(() => {
      const { main } = require('../../scripts/memory-cli.ts')
      main(['restore', path.join(archiveDir, snapBak), 'snapshot'])
    })

    expect(fs.readFileSync(mem, 'utf8')).toBe('m')
    expect(fs.readFileSync(snap, 'utf8')).toBe('s')

    process.chdir(origCwd)
    if (origMem) process.env.MEM_PATH = origMem
    else delete process.env.MEM_PATH
    if (origSnap) process.env.SNAPSHOT_PATH = origSnap
    else delete process.env.SNAPSHOT_PATH
    fs.rmSync(tmp, { recursive: true, force: true })
  })
})
