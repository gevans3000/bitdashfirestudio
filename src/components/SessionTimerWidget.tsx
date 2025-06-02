'use client'
import { useEffect, useState } from 'react'
import DataCard from '@/components/DataCard'
import { getSession, nyseCountdown, type Session } from '@/lib/marketSessions'

function format(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}h ${m}m ${s}s`
}

export default function SessionTimerWidget() {
  const [now, setNow] = useState<Date>(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const { label, seconds } = nyseCountdown(now)
  const session: Session = getSession(now)
  const sessionColors: Record<Session, string> = {
    Asia: 'text-yellow-600',
    EU: 'text-green-600',
    US: 'text-blue-600',
    Closed: 'text-gray-600',
  }

  return (
    <DataCard title="Market Sessions">
      <div className="text-center space-y-1">
        <p className="text-sm font-medium">NYSE {label}</p>
        <p className="text-2xl font-bold">{format(seconds)}</p>
        <p className={`text-sm font-medium ${sessionColors[session]}`}>{
          session === 'Closed' ? 'No major session' : `${session} session active`
        }</p>
      </div>
    </DataCard>
  )
}
