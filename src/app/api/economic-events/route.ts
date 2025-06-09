import { NextResponse } from 'next/server'
import { fetchHighImpactEvents } from '@/lib/data/economicEvents'
import { CACHE_TTL } from '@/lib/constants'

let cache: { ts: number; data: any } | null = null
const TTL = CACHE_TTL

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json({ events: cache.data, status: 'cached' })
  }
  const events = await fetchHighImpactEvents()
  cache = { ts: Date.now(), data: events }
  return NextResponse.json({ events, status: 'fresh' })
}
