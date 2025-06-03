import { NextResponse } from 'next/server'
import { fetchVolumeProfileData } from '@/lib/data/coingecko'
import { calculateVolumeProfile } from '@/lib/indicators'

interface VolumePoint {
  price: number
  volume: number
}

interface CacheEntry {
  data: VolumePoint[]
  ts: number
}

let cache: CacheEntry | null = null
const CACHE_DURATION = 60 * 1000

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_DURATION) {
    return NextResponse.json({ profile: cache.data, status: 'cached' })
  }
  try {
    const candles = await fetchVolumeProfileData()
    const prices = candles.map(c => c.c)
    const volumes = candles.map(c => c.v)
    const profile = calculateVolumeProfile(prices, volumes, 20)
    cache = { data: profile, ts: Date.now() }
    return NextResponse.json({ profile, status: 'fresh' })
  } catch (e) {
    console.error('Volume profile route error', e)
    if (cache) {
      return NextResponse.json({ profile: cache.data, status: 'cached_error' })
    }
    return NextResponse.json({ profile: [], status: 'error' })
  }
}
