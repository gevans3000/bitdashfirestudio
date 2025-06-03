import { NextResponse } from 'next/server'
import { fetchBybitOpenInterest } from '@/lib/data/bybitOpenInterest'

let cache: { ts: number; data: any } | null = null
const TTL = 60 * 1000

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json({ oi: cache.data, status: 'cached' })
  }
  const data = await fetchBybitOpenInterest()
  cache = { ts: Date.now(), data }
  return NextResponse.json({ oi: data, status: 'fresh' })
}
