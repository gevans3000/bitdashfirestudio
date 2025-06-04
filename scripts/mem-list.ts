import minimist from 'minimist'
import { readMemoryLines, parseMemoryLines } from './memory-utils'

const argv = minimist(process.argv.slice(2), { alias: { n: 'limit' } })
const limit = parseInt(argv.n || argv.limit || argv._[0] || '10', 10)
const lines = readMemoryLines()
const entries = parseMemoryLines(lines)
const slice = entries.slice(-limit)
for (const e of slice) {
  console.log(e.raw)
}
