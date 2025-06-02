import { NextResponse } from 'next/server';

interface CacheEntry {
  data: { rate: number; fundingTime: number };
  ts: number;
}

let cache: CacheEntry | null = null;
const CACHE_DURATION = 15 * 1000; // 15 seconds

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_DURATION) {
    return NextResponse.json({ ...cache.data, status: 'cached' });
  }
  try {
    const res = await fetch(
      'https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=1',
      { cache: 'no-store' },
    );
    if (!res.ok) throw new Error('Funding rate fetch error');
    const json = await res.json();
    const { fundingRate, fundingTime } = json[0] || { fundingRate: '0', fundingTime: 0 };
    const rate = parseFloat(fundingRate) * 100;
    const data = { rate, fundingTime: Number(fundingTime) };
    cache = { data, ts: Date.now() };
    return NextResponse.json({ ...data, status: 'fresh' });
  } catch (e) {
    console.error('Funding rate route error', e);
    if (cache) return NextResponse.json({ ...cache.data, status: 'cached_error' });
    return NextResponse.json({ rate: 0, fundingTime: 0, status: 'error' });
  }
}
