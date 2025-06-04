import { NextResponse } from 'next/server'
import fs from 'fs'
import { snapshotPath, parseSnapshotEntries } from '../../../../scripts/memory-utils'

export async function GET() {
  const lines = fs.existsSync(snapshotPath)
    ? fs.readFileSync(snapshotPath, 'utf8').split('\n')
    : []
  const entries = parseSnapshotEntries(lines)
  return NextResponse.json(entries)
}
