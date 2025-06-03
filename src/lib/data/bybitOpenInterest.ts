import { cachedFetch } from '@/lib/fetchCache'

interface OiPoint {
  ts: number
  oi: number
}

export async function fetchBybitOpenInterest(symbol = 'BTCUSDT'): Promise<OiPoint[]> {
  const url = `https://api.bybit.com/v5/market/open-interest?category=linear&symbol=${symbol}&interval=1h&limit=24`
  try {
    const json = await cachedFetch<any>(url, 'reference')
    if (!Array.isArray(json?.result?.list)) return []
    return json.result.list.map((d: any) => ({ ts: Number(d.timestamp), oi: Number(d.sumOpenInterest) }))
  } catch {
    return []
  }
}
