'use client'
import { useEffect, useState } from 'react'
import DataCard from '@/components/DataCard'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface OIResp {
  deltas: { t: number; oi: number }[]
  delta: number
  status: string
}

export default function OpenInterestDeltaWidget() {
  const [data, setData] = useState<OIResp | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/open-interest-delta')
        if (!res.ok) throw new Error('API error')
        setData(await res.json())
      } catch (e) {
        console.error('OI delta fetch failed', e)
      }
    }
    fetchData()
    const id = setInterval(fetchData, 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const deltaColor = data && data.delta >= 0 ? 'text-green-600' : 'text-red-600'

  return (
    <DataCard title="OI 1h Delta" className="sm:col-span-2">
      {data ? (
        <>
          <p className={`text-center font-bold ${deltaColor}`}>{data.delta.toFixed(2)}</p>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.deltas} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <XAxis dataKey="t" hide tickFormatter={formatTime} />
                <Tooltip labelFormatter={v => formatTime(Number(v))} />
                <Area type="monotone" dataKey="oi" stroke="#60a5fa" fill="rgba(96,165,250,0.4)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <p className="text-center p-4">Loading open interest...</p>
      )}
    </DataCard>
  )
}
