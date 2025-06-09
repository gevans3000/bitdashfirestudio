import { NextResponse } from 'next/server'
import {
  readMemoryLines,
  parseMemoryLines,
  MemoryEntry,
} from '../../../../scripts/memory-utils'
import { CACHE_TTL } from '@/lib/constants'

let cache: { ts: number; data: MemoryEntry[] } | null = null
const TTL = parseInt(process.env.MEMORY_API_TTL || String(CACHE_TTL / 1000), 10) * 1000

export async function GET(req: Request) {
  if (!cache || Date.now() - cache.ts >= TTL) {
    const lines = readMemoryLines()
    const entries = parseMemoryLines(lines)
    cache = { ts: Date.now(), data: entries }
  }
  const url = new URL(req.url)
  const sinceArg = url.searchParams.get('since')
  const untilArg = url.searchParams.get('until')
  const since = sinceArg ? Date.parse(sinceArg) : NaN
  const until = untilArg ? Date.parse(untilArg) : NaN
  let data = cache!.data
  if (!Number.isNaN(since) || !Number.isNaN(until)) {
    data = data.filter((e) => {
      const ts = Date.parse(e.timestamp)
      if (!Number.isNaN(since) && ts < since) return false
      if (!Number.isNaN(until) && ts > until) return false
      return true
    })
  }
  return NextResponse.json(data)
}
