import { NextResponse } from 'next/server';
import { fetchBackfill } from '@/lib/data/coingecko';
import { volumeWeightedAveragePrice } from '@/lib/indicators';

interface CacheEntry {
  data: { vwap: number; deviationPct: number };
  ts: number;
}

let cache: CacheEntry | null = null;
const CACHE_DURATION = 60 * 1000; // 60 seconds

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_DURATION) {
    return NextResponse.json({ ...cache.data, status: 'cached' });
  }
  try {
    const candles = await fetchBackfill();
    const closes = candles.map(c => c.c);
    const volumes = candles.map(c => c.v);
    const vwap = volumeWeightedAveragePrice(closes, volumes, 12);
    const current = closes[closes.length - 1];
    const deviationPct = vwap ? ((current - vwap) / vwap) * 100 : 0;
    cache = { data: { vwap, deviationPct }, ts: Date.now() };
    return NextResponse.json({ vwap, deviationPct, status: 'fresh' });
  } catch (e) {
    console.error('VWAP route error', e);
    if (cache) return NextResponse.json({ ...cache.data, status: 'cached_error' });
    return NextResponse.json({ vwap: 0, deviationPct: 0, status: 'error' });
  }
}
