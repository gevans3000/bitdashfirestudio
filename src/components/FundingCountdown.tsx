'use client'
import { useEffect, useState } from 'react'
import DataCard from '@/components/DataCard'

export default function FundingCountdown() {
  const [nextTime, setNextTime] = useState<number | null>(null)
  const [diff, setDiff] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/funding-schedule')
        const json = await res.json()
        if (Array.isArray(json.schedule) && json.schedule.length) {
          setNextTime(json.schedule[0].time)
        }
      } catch (e) {
        console.error('Funding schedule fetch failed', e)
      }
    }
    fetchData()
    const id = setInterval(fetchData, 60 * 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!nextTime) return
    const update = () => setDiff(nextTime - Date.now())
    update()
    const id = setInterval(update, 2000) // update less frequently
    return () => clearInterval(id)
  }, [nextTime])

  const format = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000))
    const m = Math.floor(s / 60)
    const h = Math.floor(m / 60)
    return `${h}h ${m % 60}m ${s % 60}s`
  }

  return (
    <DataCard title="Next Funding In">
      {nextTime ? <p className="text-center text-xl">{format(diff)}</p> : <p className="text-center p-4">Loading...</p>}
    </DataCard>
  )
}
