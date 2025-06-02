import { NextResponse } from 'next/server'

interface CacheEntry {
  data: { deltas: { t: number; oi: number }[]; delta: number }
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
      'https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=5m&limit=12',
      { cache: 'no-store' },
    )
    if (!res.ok) throw new Error('OI fetch error')
    const json = await res.json()
    const deltas = json.map((d: any) => ({
      t: d.timestamp,
      oi: parseFloat(d.sumOpenInterestValue || d.sumOpenInterest),
    }))
    const delta = deltas.length > 1 ? deltas[deltas.length - 1].oi - deltas[0].oi : 0
    const data = { deltas, delta }
    cache = { data, ts: Date.now() }
    return NextResponse.json({ ...data, status: 'fresh' })
  } catch (e) {
    console.error('OI delta route error', e)
    if (cache) return NextResponse.json({ ...cache.data, status: 'cached_error' })
    return NextResponse.json({ deltas: [], delta: 0, status: 'error' })
  }
}
