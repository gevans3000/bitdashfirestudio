'use client'
import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import DataCard from '@/components/DataCard'

interface VolumePoint {
  price: number
  volume: number
}

export default function VolumeProfileChart() {
  const [data, setData] = useState<VolumePoint[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/volume-profile')
        if (!res.ok) throw new Error('API error')
        const json = await res.json()
        setData(json.profile)
      } catch (e) {
        console.error('Volume profile fetch failed', e)
      }
    }
    fetchData()
    const id = setInterval(fetchData, 60 * 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <DataCard title="Volume Profile" className="sm:col-span-2 lg:col-span-2">
      {data.length ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <XAxis dataKey="price" tickFormatter={(v) => v.toFixed(0)} />
            <YAxis />
            <Tooltip
              formatter={(v: unknown) => Number(v as number).toFixed(2)}
              labelFormatter={(v: unknown) => Number(v as number).toFixed(2)}
            />
            <Bar dataKey="volume" fill="#60a5fa" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center p-4">Loading volume profile...</p>
      )}
    </DataCard>
  )
}
