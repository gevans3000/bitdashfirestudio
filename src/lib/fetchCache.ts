export type FetchImportance = 'critical' | 'context' | 'reference'

const TTL: Record<FetchImportance, number> = {
  critical: 60 * 1000,
  context: 5 * 60 * 1000,
  reference: 30 * 60 * 1000,
}

interface CacheEntry {
  data: any
  ts: number
}

const cache = new Map<string, CacheEntry>()
const MAX_TTL = TTL.reference

function cleanup() {
  const now = Date.now()
  for (const [key, entry] of cache.entries()) {
    if (now - entry.ts > MAX_TTL) cache.delete(key)
  }
}

export function hasFreshCache(url: string, importance: FetchImportance): boolean {
  const entry = cache.get(url)
  if (!entry) return false
  return Date.now() - entry.ts < TTL[importance]
}

export async function cachedFetch<T>(
  url: string,
  importance: FetchImportance,
  init?: RequestInit,
): Promise<T> {
  cleanup()
  const entry = cache.get(url)
  const ttl = TTL[importance]
  if (entry && Date.now() - entry.ts < ttl) {
    return entry.data as T
  }
  const res = await fetch(url, { cache: 'no-store', ...(init || {}) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = (await res.json()) as T
  cache.set(url, { data, ts: Date.now() })
  return data
}
