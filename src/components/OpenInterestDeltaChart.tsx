'use client'
import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import DataCard from '@/components/DataCard'

interface Point { ts: number; oi: number }

export default function OpenInterestDeltaChart() {
  const [data, setData] = useState<Point[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/open-interest')
        const json = await res.json()
        setData(json.oi)
      } catch (e) {
        console.error('OI fetch failed', e)
      }
    }
    fetchData()
    const id = setInterval(fetchData, 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <DataCard title="Open Interest Delta" className="sm:col-span-2 lg:col-span-2">
      {data.length ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="ts" tickFormatter={formatTime} minTickGap={20} />
            <YAxis />
            <Tooltip labelFormatter={(v) => formatTime(Number(v))} />
            <Line type="monotone" dataKey="oi" stroke="#3b82f6" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center p-4">Loading open interest...</p>
      )}
    </DataCard>
  )
}
