import { NextResponse } from 'next/server'
import { fetchBybitOpenInterest } from '@/lib/data/bybitOpenInterest'
import { computeOiDelta } from '@/lib/openInterest'

export async function GET() {
  const data = await fetchBybitOpenInterest()
  const delta = computeOiDelta(data)
  return NextResponse.json({ delta })
}
