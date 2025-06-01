import { NextResponse } from 'next/server';
import { fetchLastHourCorrelation } from '@/lib/marketData';

interface CacheEntry {
  data: Array<{ pair: string; value: number }>;
  ts: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let cache: CacheEntry | null = null;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_DURATION) {
    return NextResponse.json(
      { data: cache.data, status: 'cached' },
      { headers: corsHeaders },
    );
  }

  try {
    const data = await fetchLastHourCorrelation();
    cache = { data, ts: Date.now() };
    return NextResponse.json(
      { data, status: 'fresh' },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error('Error in correlation API:', error);
    if (cache) {
      return NextResponse.json(
        { data: cache.data, status: 'cached_error' },
        { headers: corsHeaders },
      );
    }
    return NextResponse.json(
      { data: [], status: 'error' },
      { headers: corsHeaders },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}
