const API_BASE = 'https://financialmodelingprep.com/api/v3';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  prices: number[];
  ts: number;
}

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  date: string;
}

const cache: Record<string, CacheEntry> = {};

async function fetchWithRetry(url: string, retries = 2, delay = 1000): Promise<any> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) return res.json();
    throw new Error(`HTTP ${res.status}`);
  } catch (e) {
    if (retries <= 0) throw e;
    await new Promise(r => setTimeout(r, delay));
    return fetchWithRetry(url, retries - 1, delay * 2);
  }
}

export async function fetchIntradayPrices(symbol: string, limit = 12): Promise<number[]> {
  const cached = cache[symbol];
  if (cached && Date.now() - cached.ts < CACHE_DURATION) return cached.prices;
  const key = process.env.NEXT_PUBLIC_FMP_API_KEY;
  if (!key) throw new Error('FMP API key not set');
  const url = `${API_BASE}/historical-chart/5min/${encodeURIComponent(symbol)}?apikey=${key}`;
  const data = await fetchWithRetry(url);
  const prices = Array.isArray(data)
    ? data.slice(0, limit).map((d: any) => Number(d.close)).reverse()
    : [];
  cache[symbol] = { prices, ts: Date.now() };
  return prices;
}

export async function fetchIntradayCandles(symbol: string, limit = 12): Promise<Candle[]> {
  const key = process.env.NEXT_PUBLIC_FMP_API_KEY;
  if (!key) throw new Error('FMP API key not set');
  const url = `${API_BASE}/historical-chart/5min/${encodeURIComponent(symbol)}?apikey=${key}`;
  const data = await fetchWithRetry(url);
  if (!Array.isArray(data)) return [];
  return data
    .slice(0, limit)
    .map((d: any) => ({
      open: Number(d.open),
      high: Number(d.high),
      low: Number(d.low),
      close: Number(d.close),
      date: d.date,
    }))
    .reverse();
}

export async function fetchDailyCandles(symbol: string, days = 20): Promise<Candle[]> {
  const key = process.env.NEXT_PUBLIC_FMP_API_KEY;
  if (!key) throw new Error('FMP API key not set');
  const url = `${API_BASE}/historical-price-full/${encodeURIComponent(symbol)}?timeseries=${days}&apikey=${key}`;
  const data = await fetchWithRetry(url);
  if (!Array.isArray(data?.historical)) return [];
  return data.historical
    .slice(0, days)
    .map((d: any) => ({
      open: Number(d.open),
      high: Number(d.high),
      low: Number(d.low),
      close: Number(d.close),
      date: d.date,
    }))
    .reverse();
}
