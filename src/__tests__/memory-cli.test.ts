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
})
