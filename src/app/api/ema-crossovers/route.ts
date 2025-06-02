import { NextResponse } from 'next/server'
import { fetchBackfill } from '@/lib/data/coingecko'
import { exponentialMovingAverage, emaCrossoverState } from '@/lib/indicators'

interface CacheEntry {
  data: {
    ema10: number
    ema20: number
    ema50: number
    ema200: number
    crossover: 'bullish' | 'bearish' | 'mixed'
  }
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
    const ema10 = exponentialMovingAverage(closes, 10)
    const ema20 = exponentialMovingAverage(closes, 20)
    const ema50 = exponentialMovingAverage(closes, 50)
    const ema200 = exponentialMovingAverage(closes, 200)
    const crossover = emaCrossoverState([ema10, ema20, ema50, ema200])
    const data = { ema10, ema20, ema50, ema200, crossover }
    cache = { data, ts: Date.now() }
    return NextResponse.json({ ...data, status: 'fresh' })
  } catch (e) {
    console.error('EMA crossovers error', e)
    if (cache) return NextResponse.json({ ...cache.data, status: 'cached_error' })
    return NextResponse.json({ ema10: 0, ema20: 0, ema50: 0, ema200: 0, crossover: 'mixed', status: 'error' })
  }
}
