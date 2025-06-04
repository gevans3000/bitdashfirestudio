import { cachedFetch, FetchImportance } from '@/lib/fetchCache'

export interface EconomicEvent {
  date: string
  event: string
  impact: string
  country?: string
}

const API_BASE = 'https://financialmodelingprep.com/api/v3'

export async function fetchEconomicCalendar(from: string, to: string): Promise<EconomicEvent[]> {
  const key = process.env.NEXT_PUBLIC_FMP_API_KEY
  if (!key) throw new Error('FMP API key not set')
  const url = `${API_BASE}/economic_calendar?from=${from}&to=${to}&apikey=${key}`
  const data = await cachedFetch<any[]>(url, 'context')
  if (!Array.isArray(data)) return []
  return data.map(d => ({
    date: d.date,
    event: d.event || d.title || '',
    impact: d.impact || d.importance || 'Low',
    country: d.country,
  }))
}

export async function fetchHighImpactEvents(daysAhead = 2): Promise<EconomicEvent[]> {
  const now = new Date()
  const from = now.toISOString().slice(0, 10)
  const to = new Date(now.getTime() + daysAhead * 86400000).toISOString().slice(0, 10)
  const events = await fetchEconomicCalendar(from, to)
  return events.filter(e => /high/i.test(e.impact))
}
