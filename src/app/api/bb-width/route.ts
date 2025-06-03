import { NextResponse } from 'next/server'
import { fetchBackfill } from '@/lib/data/coingecko'
import { bollingerWidth } from '@/lib/indicators'

let cache: { data: number; ts: number } | null = null
const TTL = 15 * 1000

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json({ width: cache.data, status: 'cached' })
  }
  try {
    const candles = await fetchBackfill()
    const closes = candles.map(c => c.c)
    const width = bollingerWidth(closes, 20, 2)
    cache = { data: width, ts: Date.now() }
    return NextResponse.json({ width, status: 'fresh' })
  } catch (e) {
    console.error('BB width error', e)
    if (cache) return NextResponse.json({ width: cache.data, status: 'cached_error' })
    return NextResponse.json({ width: 0, status: 'error' })
  }
}
