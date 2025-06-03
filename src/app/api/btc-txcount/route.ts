import { NextResponse } from 'next/server'

interface CacheEntry {
  data: { count: number }
  ts: number
}

let cache: CacheEntry | null = null
const CACHE_DURATION = 60 * 1000

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_DURATION) {
    return NextResponse.json({ ...cache.data, status: 'cached' })
  }
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin', {
      cache: 'no-store',
    })
    if (!res.ok) throw new Error('tx count fetch error')
    const json = await res.json()
    const rawCount =
      json?.market_data?.chain_stats?.transaction_count_24h ??
      json?.market_data?.transactions_24h
    const count = Number(rawCount) || 0
    const data = { count }
    cache = { data, ts: Date.now() }
    return NextResponse.json({ ...data, status: 'fresh' })
  } catch (e) {
    console.error('BTC tx count route error', e)
    if (cache) return NextResponse.json({ ...cache.data, status: 'cached_error' })
    return NextResponse.json({ count: 0, status: 'error' })
  }
}
