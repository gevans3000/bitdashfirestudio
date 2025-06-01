import { NextResponse } from 'next/server';

interface DepthCache {
  data: any;
  ts: number;
}

let cache: DepthCache | null = null;
const CACHE_DURATION = 15 * 1000; // 15 seconds

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_DURATION) {
    return NextResponse.json({ ...cache.data, status: 'cached' });
  }
  try {
    const res = await fetch(
      'https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=20',
      { cache: 'no-store' },
    );
    if (!res.ok) throw new Error('Binance depth error');
    const json = await res.json();
    cache = { data: json, ts: Date.now() };
    return NextResponse.json({ ...json, status: 'fresh' });
  } catch (e) {
    console.error('Orderbook fetch error', e);
    if (cache) return NextResponse.json({ ...cache.data, status: 'cached_error' });
    return NextResponse.json({ bids: [], asks: [], status: 'error' });
  }
}
