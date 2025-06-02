import { NextResponse } from 'next/server'

interface CacheEntry {
  data: { delta: number; buyPressure: number }
  ts: number
}

let cache: CacheEntry | null = null
const CACHE_DURATION = 15 * 1000

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_DURATION) {
    return NextResponse.json({ ...cache.data, status: 'cached' })
  }
  try {
    const res = await fetch(
      'https://api.binance.com/api/v3/aggTrades?symbol=BTCUSDT&limit=100',
      { cache: 'no-store' },
    )
    if (!res.ok) throw new Error('Binance aggTrades error')
    const trades = await res.json()
    let buyVol = 0
    let sellVol = 0
    let delta = 0
    for (const t of trades) {
      const qty = parseFloat(t.q)
      if (t.m) {
        sellVol += qty
        delta -= qty
      } else {
        buyVol += qty
        delta += qty
      }
    }
    const buyPressure = buyVol + sellVol ? (buyVol / (buyVol + sellVol)) * 100 : 0
    cache = { data: { delta, buyPressure }, ts: Date.now() }
    return NextResponse.json({ delta, buyPressure, status: 'fresh' })
  } catch (e) {
    console.error('Cumulative delta error', e)
    if (cache) return NextResponse.json({ ...cache.data, status: 'cached_error' })
    return NextResponse.json({ delta: 0, buyPressure: 0, status: 'error' })
  }
}
