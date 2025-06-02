'use client'
import { useEffect, useState } from 'react'
import DataCard from '@/components/DataCard'

interface TxResp {
  count: number
  status: string
}

export default function TxnCountWidget() {
  const [data, setData] = useState<TxResp | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/btc-txcount')
        if (!res.ok) throw new Error('API error')
        setData(await res.json())
      } catch (e) {
        console.error('BTC tx count fetch failed', e)
      }
    }
    fetchData()
    const id = setInterval(fetchData, 60 * 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <DataCard title="BTC On-Chain Txns">
      {data ? (
        <p className="text-center text-2xl font-bold">
          {data.count.toLocaleString()}
        </p>
      ) : (
        <p className="text-center p-4">Loading tx count...</p>
      )}
    </DataCard>
  )
}
