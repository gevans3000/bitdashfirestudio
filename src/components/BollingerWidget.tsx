'use client'
import { useEffect, useState } from 'react'
import DataCard from '@/components/DataCard'

interface BbResp {
  upper: number
  middle: number
  lower: number
  price: number
  status: string
}

export default function BollingerWidget() {
  const [data, setData] = useState<BbResp | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/bollinger')
        if (!res.ok) throw new Error('API error')
        setData(await res.json())
      } catch (e) {
        console.error('Bollinger fetch failed', e)
      }
    }
    fetchData()
    const id = setInterval(fetchData, 60 * 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <DataCard title="Bollinger Bands">
      {data ? (
        <div className="text-center space-y-1">
          <p className="text-sm">Upper {data.upper.toFixed(2)}</p>
          <p className="text-2xl font-bold">{data.price.toFixed(2)}</p>
          <p className="text-sm">Lower {data.lower.toFixed(2)}</p>
        </div>
      ) : (
        <p className="text-center p-4">Loading Bollinger...</p>
      )}
    </DataCard>
  )
}
