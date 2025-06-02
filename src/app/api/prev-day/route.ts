import { NextResponse } from 'next/server';
import { cachedFetch } from '@/lib/fetchCache';

interface CacheEntry {
  data: { high: number; low: number; vwap: number };
  ts: number;
}

let cache: CacheEntry | null = null;
const CACHE_DURATION = 15 * 1000; // 15 seconds
const URL =
  'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=5m&limit=288';

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_DURATION) {
    return NextResponse.json({ ...cache.data, status: 'cached' });
  }
  try {
    const data = await cachedFetch<any[]>(URL, 'reference');
    if (!Array.isArray(data)) throw new Error('bad data');
    let high = -Infinity;
    let low = Infinity;
    let pv = 0;
    let vol = 0;
    for (const k of data) {
      const h = Number(k[2]);
      const l = Number(k[3]);
      const c = Number(k[4]);
      const v = Number(k[5]);
      if (h > high) high = h;
      if (l < low) low = l;
      pv += c * v;
      vol += v;
    }
    const vwap = vol ? pv / vol : 0;
    const result = { high, low, vwap };
    cache = { data: result, ts: Date.now() };
    return NextResponse.json({ ...result, status: 'fresh' });
  } catch (e) {
    console.error('Prev-day bands error', e);
    if (cache)
      return NextResponse.json({ ...cache.data, status: 'cached_error' });
    return NextResponse.json({ high: 0, low: 0, vwap: 0, status: 'error' });
  }
}
