import { cachedFetch, FetchImportance } from '@/lib/fetchCache'

const API_BASE = 'https://financialmodelingprep.com/api/v3'

interface Candle {
  open: number
  high: number
  low: number
  close: number
  date: string
}

async function fetchWithRetry(
  url: string,
  importance: FetchImportance,
  retries = 2,
  delay = 1000,
): Promise<any> {
  try {
    return await cachedFetch(url, importance)
  } catch (e) {
    if (retries <= 0) throw e
    await new Promise(r => setTimeout(r, delay))
    return fetchWithRetry(url, importance, retries - 1, delay * 2)
  }
}

export async function fetchIntradayPrices(symbol: string, limit = 12): Promise<number[]> {
  const key = process.env.NEXT_PUBLIC_FMP_API_KEY
  if (!key) throw new Error('FMP API key not set');
  const url = `${API_BASE}/historical-chart/5min/${encodeURIComponent(symbol)}?apikey=${key}`
  const data = await fetchWithRetry(url, 'context')
  const prices = Array.isArray(data)
    ? data.slice(0, limit).map((d: any) => Number(d.close)).reverse()
    : []
  return prices
}

export async function fetchIntradayCandles(symbol: string, limit = 12): Promise<Candle[]> {
  const key = process.env.NEXT_PUBLIC_FMP_API_KEY;
  if (!key) throw new Error('FMP API key not set');
  const url = `${API_BASE}/historical-chart/5min/${encodeURIComponent(symbol)}?apikey=${key}`;
  const data = await fetchWithRetry(url, 'context');
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
  const data = await fetchWithRetry(url, 'reference');
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
