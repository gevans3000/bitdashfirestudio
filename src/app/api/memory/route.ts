import { NextResponse } from 'next/server'
import {
  readMemoryLines,
  parseMemoryLines,
  MemoryEntry,
} from '../../../../scripts/memory-utils'

let cache: { ts: number; data: MemoryEntry[] } | null = null
const TTL = 15 * 1000

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json(cache.data)
  }
  const lines = readMemoryLines()
  const entries = parseMemoryLines(lines)
  cache = { ts: Date.now(), data: entries }
  return NextResponse.json(entries)
}
