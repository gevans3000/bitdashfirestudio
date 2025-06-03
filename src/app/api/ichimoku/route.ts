import { NextResponse } from "next/server";
import { fetchIntradayCandles } from "@/lib/data/fmp";
import { ichimokuCloud } from "@/lib/indicators";

interface CacheEntry {
  data: {
    tenkan: number;
    kijun: number;
    spanA: number;
    spanB: number;
    price: number;
  };
  ts: number;
}

let cache: CacheEntry | null = null;
const CACHE_DURATION = 60 * 1000;

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_DURATION) {
    return NextResponse.json({ ...cache.data, status: "cached" });
  }
  try {
    const candles = await fetchIntradayCandles("BTCUSD", 60);
    const ichimoku = ichimokuCloud(candles);
    const price = candles[candles.length - 1]?.close || 0;
    const data = { ...ichimoku, price };
    cache = { data, ts: Date.now() };
    return NextResponse.json({ ...data, status: "fresh" });
  } catch (e) {
    console.error("Ichimoku route error", e);
    if (cache)
      return NextResponse.json({ ...cache.data, status: "cached_error" });
    return NextResponse.json({
      tenkan: 0,
      kijun: 0,
      spanA: 0,
      spanB: 0,
      price: 0,
      status: "error",
    });
  }
}
