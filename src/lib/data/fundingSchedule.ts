import { cachedFetch } from '@/lib/fetchCache'

interface FundingItem {
  time: number
  rate: number
}

export async function fetchFundingSchedule(symbol = 'BTCUSDT'): Promise<FundingItem[]> {
  const url = `https://api.bybit.com/v5/market/funding/history?category=linear&symbol=${symbol}&limit=8`
  try {
    const json = await cachedFetch<any>(url, 'reference')
    if (!Array.isArray(json?.result?.list)) return []
    return json.result.list.map((d: any) => ({ time: Number(d.fundingRateTimestamp), rate: Number(d.fundingRate) }))
  } catch {
    return []
  }
}
