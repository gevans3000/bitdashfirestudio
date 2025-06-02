import { NextResponse } from 'next/server';
import { fetchBackfill } from '@/lib/data/coingecko';

interface VolumePoint {
  t: number;
  volume: number;
  spike: boolean;
}

interface CacheEntry {
  data: VolumePoint[];
  ts: number;
}

let cache: CacheEntry | null = null;
const CACHE_DURATION = 15 * 1000; // 15 seconds

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_DURATION) {
    return NextResponse.json({ volumes: cache.data, status: 'cached' });
  }
  try {
    const candles = await fetchBackfill();
    const volumes = candles.map(c => c.v);
    const points: VolumePoint[] = [];
    for (let i = 0; i < volumes.length; i++) {
      const start = Math.max(0, i - 19);
      const slice = volumes.slice(start, i + 1);
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      const spike = volumes[i] > avg * 1.5;
      points.push({ t: candles[i].t, volume: volumes[i], spike });
    }
    cache = { data: points, ts: Date.now() };
    return NextResponse.json({ volumes: points, status: 'fresh' });
  } catch (e) {
    console.error('Volume spikes error', e);
    if (cache) return NextResponse.json({ volumes: cache.data, status: 'cached_error' });
    return NextResponse.json({ volumes: [], status: 'error' });
  }
}
