import { NextResponse } from 'next/server'
import { fetchVolumeProfileData } from '@/lib/data/coingecko'
import { calculateVolumeProfile } from '@/lib/indicators'

interface VolumePoint {
  price: number
  volume: number
}

interface CacheEntry {
  data: VolumePoint[]
  distance: number
  ts: number
}

let cache: CacheEntry | null = null
const CACHE_DURATION = 60 * 1000

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_DURATION) {
    return NextResponse.json({
      profile: cache.data,
      distance: cache.distance,
      status: 'cached',
    })
  }
  try {
    const candles = await fetchVolumeProfileData()
    const prices = candles.map(c => c.c)
    const volumes = candles.map(c => c.v)
    const profile = calculateVolumeProfile(prices, volumes, 20)
    const peak = profile.reduce((p, c) => (c.volume > p.volume ? c : p), profile[0])
    const currentPrice = prices[prices.length - 1]
    const distance = Math.abs(currentPrice - peak.price)
    cache = { data: profile, distance, ts: Date.now() }
    return NextResponse.json({
      profile,
      distance,
      status: 'fresh',
    })
  } catch (e) {
    console.error('Volume profile route error', e)
    if (cache) {
      return NextResponse.json({
        profile: cache.data,
        distance: cache.distance,
        status: 'cached_error',
      })
    }
    return NextResponse.json({ profile: [], distance: 0, status: 'error' })
  }
}
