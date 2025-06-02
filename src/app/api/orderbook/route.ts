import { NextResponse } from 'next/server'
import { cachedFetch, hasFreshCache } from '@/lib/fetchCache'

const URL = 'https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=20'

export async function GET() {
  const cached = hasFreshCache(URL, 'critical')
  try {
    const json = await cachedFetch<any>(URL, 'critical')
    return NextResponse.json({ ...json, status: cached ? 'cached' : 'fresh' })
  } catch (e) {
    console.error('Orderbook fetch error', e)
    return NextResponse.json({ bids: [], asks: [], status: 'error' })
  }
}
