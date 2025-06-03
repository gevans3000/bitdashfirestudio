'use client'
import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import DataCard from '@/components/DataCard'

interface Cluster {
  ts: number
  buyQty: number
  sellQty: number
}

export default function LiquidationClustersChart() {
  const [data, setData] = useState<Cluster[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/liquidation-clusters')
        const json = await res.json()
        setData(json.clusters)
      } catch (e) {
        console.error('Cluster fetch failed', e)
      }
    }
    fetchData()
    const id = setInterval(fetchData, 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <DataCard title="Liquidation Clusters" className="sm:col-span-2 lg:col-span-2">
      {data.length ? (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="ts" tickFormatter={formatTime} minTickGap={20} />
            <YAxis />
            <Tooltip labelFormatter={(v) => formatTime(Number(v))} />
            <Area dataKey="buyQty" stroke="#16a34a" fill="rgba(34,197,94,0.3)" />
            <Area dataKey="sellQty" stroke="#dc2626" fill="rgba(239,68,68,0.3)" />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center p-4">Loading clusters...</p>
      )}
    </DataCard>
  )
}
