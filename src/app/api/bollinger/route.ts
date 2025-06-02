import { NextResponse } from 'next/server'
import { fetchBackfill } from '@/lib/data/coingecko'
import { bollingerBands } from '@/lib/indicators'

interface CacheEntry {
  data: { upper: number; middle: number; lower: number; price: number }
  ts: number
}

let cache: CacheEntry | null = null
const CACHE_DURATION = 15 * 1000

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_DURATION) {
    return NextResponse.json({ ...cache.data, status: 'cached' })
  }
  try {
    const candles = await fetchBackfill()
    const closes = candles.map(c => c.c)
    const price = closes[closes.length - 1]
    const bands = bollingerBands(closes, 20, 2)
    const data = { ...bands, price }
    cache = { data, ts: Date.now() }
    return NextResponse.json({ ...data, status: 'fresh' })
  } catch (e) {
    console.error('Bollinger route error', e)
    if (cache) return NextResponse.json({ ...cache.data, status: 'cached_error' })
    return NextResponse.json({ upper: 0, middle: 0, lower: 0, price: 0, status: 'error' })
  }
}
