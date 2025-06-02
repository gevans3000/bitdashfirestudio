'use client'
import { useEffect, useState } from 'react'
import DataCard from '@/components/DataCard'

interface RsiResp {
  rsi: number
  status: string
}

export default function RsiWidget() {
  const [data, setData] = useState<RsiResp | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/rsi')
        if (!res.ok) throw new Error('API error')
        setData(await res.json())
      } catch (e) {
        console.error('RSI fetch failed', e)
      }
    }
    fetchData()
    const id = setInterval(fetchData, 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const value = data ? data.rsi : 50
  let label: string | null = null
  if (value >= 70) label = 'Overbought'
  else if (value <= 30) label = 'Oversold'

  return (
    <DataCard title="RSI">
      {data ? (
        <div className="text-center space-y-1">
          <p className="text-2xl font-bold">{value.toFixed(2)}</p>
          {label && (
            <p className="text-sm font-medium text-red-600">{label}</p>
          )}
        </div>
      ) : (
        <p className="text-center p-4">Loading RSI...</p>
      )}
    </DataCard>
  )
}
