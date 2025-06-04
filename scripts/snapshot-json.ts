import fs from 'fs'
import path from 'path'
import { repoRoot, snapshotPath, parseSnapshotEntries, atomicWrite, withFileLock } from './memory-utils'

const lines = fs.existsSync(snapshotPath)
  ? fs.readFileSync(snapshotPath, 'utf8').split('\n')
  : []
const entries = parseSnapshotEntries(lines)
const outPath = path.join(repoRoot, 'snapshot.json')
withFileLock(outPath, () => {
  atomicWrite(outPath, JSON.stringify(entries, null, 2) + '\n')
})
console.log(`snapshot.json written to ${outPath}`)
