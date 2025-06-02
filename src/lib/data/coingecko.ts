import { getCachedData, setCachedData } from '@/lib/cache'
import { cachedFetch } from '@/lib/fetchCache'

export interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

const CACHE_KEY = 'cg_btc_5m';

export async function fetchBackfill(): Promise<Candle[]> {
  const cached = getCachedData<Candle[]>(CACHE_KEY)
  if (cached) return cached
  const url =
    'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1&interval=5m'
  const json = await cachedFetch<any>(url, 'reference')
  const candles: Candle[] = json.prices.map((p: [number, number], idx: number) => {
    const [t, price] = p;
    const volume = json.total_volumes[idx][1];
    return { t, o: price, h: price, l: price, c: price, v: volume };
  });
  setCachedData(CACHE_KEY, candles);
  return candles;
}
