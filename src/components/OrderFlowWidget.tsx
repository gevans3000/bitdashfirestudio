'use client'
import { useEffect, useState } from 'react'
import DataCard from '@/components/DataCard'

interface DeltaResp {
  delta: number
  buyPressure: number
  status: string
}

export default function OrderFlowWidget() {
  const [data, setData] = useState<DeltaResp | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/cum-delta')
        if (!res.ok) throw new Error('API error')
        setData(await res.json())
      } catch (e) {
        console.error('Cumulative delta fetch failed', e)
      }
    }
    fetchData()
    const id = setInterval(fetchData, 15000)
    return () => clearInterval(id)
  }, [])

  const deltaColor = data && data.delta >= 0 ? 'text-green-600' : 'text-red-600'

  return (
    <DataCard title="Cumulative Delta">
      {data ? (
        <div className="text-center space-y-1">
          <p className={`text-2xl font-bold ${deltaColor}`}>{data.delta.toFixed(2)}</p>
          <p className="text-sm font-medium">{data.buyPressure.toFixed(2)}% Buy</p>
        </div>
      ) : (
        <p className="text-center p-4">Loading delta...</p>
      )}
    </DataCard>
  )
}
