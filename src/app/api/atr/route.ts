import { NextResponse } from 'next/server';
import { fetchIntradayCandles, fetchDailyCandles } from '@/lib/data/fmp';
import { averageTrueRange } from '@/lib/indicators';

interface Cached {
  data: { atr1h: number; atr20d: number };
  ts: number;
}

let cache: Cached | null = null;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_DURATION) {
    return NextResponse.json({ ...cache.data, status: 'cached' });
  }
  try {
    const intraday = await fetchIntradayCandles('BTCUSD', 13); // ~1h
    const daily = await fetchDailyCandles('BTCUSD', 21); // 20 day ATR
    const atr1h = averageTrueRange(intraday, 12);
    const atr20d = averageTrueRange(daily, 20);
    cache = { data: { atr1h, atr20d }, ts: Date.now() };
    return NextResponse.json({ atr1h, atr20d, status: 'fresh' });
  } catch (e) {
    console.error('ATR route error', e);
    if (cache) return NextResponse.json({ ...cache.data, status: 'cached_error' });
    return NextResponse.json({ atr1h: 0, atr20d: 0, status: 'error' });
  }
}
