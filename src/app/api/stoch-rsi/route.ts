import { NextResponse } from 'next/server';
import { fetchBackfill } from '@/lib/data/coingecko';
import { stochasticRsi } from '@/lib/indicators';

interface CacheEntry {
  data: { stoch: number };
  ts: number;
}

let cache: CacheEntry | null = null;
const CACHE_DURATION = 15 * 1000; // 15 seconds

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_DURATION) {
    return NextResponse.json({ ...cache.data, status: 'cached' });
  }
  try {
    const candles = await fetchBackfill();
    const closes = candles.map(c => c.c);
    const stoch = stochasticRsi(closes, 14);
    cache = { data: { stoch }, ts: Date.now() };
    return NextResponse.json({ stoch, status: 'fresh' });
  } catch (e) {
    console.error('Stoch RSI route error', e);
    if (cache) return NextResponse.json({ ...cache.data, status: 'cached_error' });
    return NextResponse.json({ stoch: 50, status: 'error' });
  }
}
