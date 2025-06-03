'use client'
import { useEffect, useState } from 'react'
import DataCard from '@/components/DataCard'

export default function VolumePeakDistance() {
  const [distance, setDistance] = useState<number | null>(null)

  useEffect(() => {
    const fetchDistance = async () => {
      try {
        const res = await fetch('/api/volume-profile')
        if (!res.ok) throw new Error('API error')
        const json = await res.json()
        setDistance(json.distance)
      } catch (e) {
        console.error('Distance fetch failed', e)
      }
    }
    fetchDistance()
    const id = setInterval(fetchDistance, 60 * 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <DataCard title="Dist. to Volume Peak" className="sm:col-span-1">
      {distance !== null ? (
        <p className="text-2xl font-semibold text-center">{distance.toFixed(2)}</p>
      ) : (
        <p className="text-center p-4">Calculating...</p>
      )}
    </DataCard>
  )
}
