'use client'
import { useEffect, useState } from 'react'
import DataCard from '@/components/DataCard'

interface MemoryEntry {
  hash: string
  summary: string
  timestamp: string
}

export default function MemoryTimeline() {
  const [entries, setEntries] = useState<MemoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/memory')
        if (!res.ok) throw new Error('API error')
        const json = await res.json()
        if (Array.isArray(json.entries)) {
          json.entries.sort(
            (a: MemoryEntry, b: MemoryEntry) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          )
          setEntries(json.entries)
        }
      } catch (e) {
        console.error('Memory fetch failed', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <DataCard title="Commit History" className="sm:col-span-2 lg:col-span-2">
      {loading ? (
        <p className="text-center p-4">Loading...</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {entries.map((e) => (
            <li key={`${e.hash}-${e.timestamp}`} className="border-b last:border-b-0 pb-1">
              <div className="flex justify-between">
                <span className="font-mono bg-muted px-1 rounded text-xs">
                  {e.hash.slice(0, 7)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(e.timestamp).toLocaleString()}
                </span>
              </div>
              <p>{e.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </DataCard>
  )
}
