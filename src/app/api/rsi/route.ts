import { NextResponse } from 'next/server'
import { fetchBackfill } from '@/lib/data/coingecko'
import { rsi } from '@/lib/indicators'

interface CacheEntry {
  data: { rsi: number }
  ts: number
}

let cache: CacheEntry | null = null
const CACHE_DURATION = 60 * 1000

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_DURATION) {
    return NextResponse.json({ ...cache.data, status: 'cached' })
  }
  try {
    const candles = await fetchBackfill()
    const closes = candles.map(c => c.c)
    const value = rsi(closes, 14)
    cache = { data: { rsi: value }, ts: Date.now() }
    return NextResponse.json({ rsi: value, status: 'fresh' })
  } catch (e) {
    console.error('RSI route error', e)
    if (cache) return NextResponse.json({ ...cache.data, status: 'cached_error' })
    return NextResponse.json({ rsi: 50, status: 'error' })
  }
}
