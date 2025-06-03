import { NextResponse } from "next/server";
import {
  fetchHourlyCandles,
  fetchFourHourCandles,
} from "@/lib/data/binanceCandles";

interface CacheEntry {
  data: { hourly: any[]; fourHour: any[] };
  ts: number;
}

let cache: CacheEntry | null = null;
const TTL = 60 * 1000;

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json({ ...cache.data, status: "cached" });
  }
  try {
    const [hourly, fourHour] = await Promise.all([
      fetchHourlyCandles(),
      fetchFourHourCandles(),
    ]);
    cache = { data: { hourly, fourHour }, ts: Date.now() };
    return NextResponse.json({ hourly, fourHour, status: "fresh" });
  } catch (e) {
    console.error("Higher timeframe candles error", e);
    if (cache)
      return NextResponse.json({ ...cache.data, status: "cached_error" });
    return NextResponse.json({ hourly: [], fourHour: [], status: "error" });
  }
}
