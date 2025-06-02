'use client'
import { useEffect, useState } from 'react'
import DataCard from '@/components/DataCard'

interface EmaResp {
  ema10: number
  ema20: number
  ema50: number
  ema200: number
  crossover: 'bullish' | 'bearish' | 'mixed'
  status: string
}

export default function EmaCrossoverWidget() {
  const [data, setData] = useState<EmaResp | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/ema-crossovers')
        if (!res.ok) throw new Error('API error')
        setData(await res.json())
      } catch (e) {
        console.error('EMA crossover fetch failed', e)
      }
    }
    fetchData()
    const id = setInterval(fetchData, 60 * 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <DataCard title="EMA Crossovers">
      {data ? (
        <div className="text-center space-y-1">
          <p className="text-2xl font-bold">{data.crossover}</p>
          <p className="text-sm">
            10:{data.ema10.toFixed(2)} 20:{data.ema20.toFixed(2)} 50:{data.ema50.toFixed(2)} 200:{data.ema200.toFixed(2)}
          </p>
        </div>
      ) : (
        <p className="text-center p-4">Loading EMAs...</p>
      )}
    </DataCard>
  )
}
