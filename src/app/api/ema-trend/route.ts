import { NextResponse } from 'next/server'
import { fetchBackfill } from '@/lib/data/coingecko'
import { fetchHourlyCandles, fetchFourHourCandles } from '@/lib/data/binanceCandles'
import { exponentialMovingAverage, emaCrossoverState, EmaTrend } from '@/lib/indicators'
import { CACHE_TTL } from '@/lib/constants'

interface CacheEntry {
  data: { trend5m: EmaTrend; trend1h: EmaTrend; trend4h: EmaTrend }
  ts: number
}

let cache: CacheEntry | null = null
const TTL = CACHE_TTL

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json({ ...cache.data, status: 'cached' })
  }
  try {
    const [five, hourly, four] = await Promise.all([
      fetchBackfill(),
      fetchHourlyCandles(),
      fetchFourHourCandles(),
    ])

    const closes5 = five.map(c => c.c)
    const closes1h = hourly.map(c => c.close)
    const closes4h = four.map(c => c.close)

    const calc = (closes: number[]) => [
      exponentialMovingAverage(closes, 10),
      exponentialMovingAverage(closes, 20),
      exponentialMovingAverage(closes, 50),
      exponentialMovingAverage(closes, 200),
    ]

    const trend5m = emaCrossoverState(calc(closes5))
    const trend1h = emaCrossoverState(calc(closes1h))
    const trend4h = emaCrossoverState(calc(closes4h))

    const data = { trend5m, trend1h, trend4h }
    cache = { data, ts: Date.now() }
    return NextResponse.json({ ...data, status: 'fresh' })
  } catch (e) {
    console.error('EMA trend compare error', e)
    if (cache) return NextResponse.json({ ...cache.data, status: 'cached_error' })
    return NextResponse.json({
      trend5m: 'mixed',
      trend1h: 'mixed',
      trend4h: 'mixed',
      status: 'error',
    })
  }
}
