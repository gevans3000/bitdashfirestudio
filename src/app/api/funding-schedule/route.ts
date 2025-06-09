import { NextResponse } from 'next/server'
import { fetchFundingSchedule } from '@/lib/data/fundingSchedule'
import { CACHE_TTL } from '@/lib/constants'

let cache: { ts: number; data: any } | null = null
const TTL = CACHE_TTL

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json({ schedule: cache.data, status: 'cached' })
  }
  const data = await fetchFundingSchedule()
  cache = { ts: Date.now(), data }
  return NextResponse.json({ schedule: data, status: 'fresh' })
}
