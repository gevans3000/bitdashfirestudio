'use client'
import { useEffect, useState } from 'react'

interface Entry {
  hash: string
  summary: string
  files: string
  timestamp: string
  entryType: string
  task?: string
  description?: string
}

export default function MemoryPage() {
  const [data, setData] = useState<Entry[]>([])
  const [sort, setSort] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetch('/api/memory')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((e) => console.error(e))
  }, [])

  const sorted = [...data].sort((a, b) => {
    const diff = Date.parse(a.timestamp) - Date.parse(b.timestamp)
    return sort === 'asc' ? diff : -diff
  })

  const toggle = () => setSort((s) => (s === 'asc' ? 'desc' : 'asc'))

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Memory Log</h1>
      <table className="min-w-full text-sm border">
        <thead>
          <tr>
            <th className="px-2 py-1 border cursor-pointer" onClick={toggle}>
              Timestamp
            </th>
            <th className="px-2 py-1 border">Hash</th>
            <th className="px-2 py-1 border">Summary</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((e, i) => (
            <tr key={i} className="border-t">
              <td className="px-2 py-1 whitespace-nowrap">{e.timestamp}</td>
              <td className="px-2 py-1 font-mono">{e.hash}</td>
              <td className="px-2 py-1">{e.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
