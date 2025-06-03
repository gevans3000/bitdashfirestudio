import { cachedFetch } from "@/lib/fetchCache";

export interface Candle {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

const BASE = "https://api.binance.com/api/v3/klines";

async function fetchCandles(
  interval: "1h" | "4h",
  limit = 24,
): Promise<Candle[]> {
  const url = `${BASE}?symbol=BTCUSDT&interval=${interval}&limit=${limit}`;
  const data = await cachedFetch<any[]>(url, "reference");
  if (!Array.isArray(data)) return [];
  return data.map((k) => ({
    openTime: Number(k[0]),
    open: Number(k[1]),
    high: Number(k[2]),
    low: Number(k[3]),
    close: Number(k[4]),
    volume: Number(k[5]),
    closeTime: Number(k[6]),
  }));
}

export function fetchHourlyCandles(limit = 24): Promise<Candle[]> {
  return fetchCandles("1h", limit);
}

export function fetchFourHourCandles(limit = 24): Promise<Candle[]> {
  return fetchCandles("4h", limit);
}
