'use client'
import { useEffect, useState } from 'react'
import DataCard from '@/components/DataCard'
import { EmaTrend } from '@/lib/indicators'

interface TrendResp {
  trend5m: EmaTrend
  trend1h: EmaTrend
  trend4h: EmaTrend
  status: string
}

export default function EmaTrendWidget() {
  const [data, setData] = useState<TrendResp | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/ema-trend')
        if (!res.ok) throw new Error('API error')
        setData(await res.json())
      } catch (e) {
        console.error('EMA trend fetch failed', e)
      }
    }
    fetchData()
    const id = setInterval(fetchData, 60 * 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <DataCard title="EMA Trends">
      {data ? (
        <div className="text-center space-y-1">
          <p className="text-sm">5m {data.trend5m}</p>
          <p className="text-sm">1h {data.trend1h}</p>
          <p className="text-sm">4h {data.trend4h}</p>
        </div>
      ) : (
        <p className="text-center p-4">Loading trend...</p>
      )}
    </DataCard>
  )
}
