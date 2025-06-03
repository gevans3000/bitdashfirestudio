'use client'
import { useEffect, useState } from 'react'
import { toast } from '@/hooks/use-toast'

export default function BbWidthAlert() {
  const [lastAlert, setLastAlert] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/bb-width')
        const json = await res.json()
        const width = json.width as number
        if (width < 1 && Date.now() - lastAlert > 60 * 1000) {
          toast({ title: 'Squeeze Alert', description: `BB width ${width.toFixed(2)}%` })
          setLastAlert(Date.now())
        }
      } catch (e) {
        console.error('BB width fetch failed', e)
      }
    }
    fetchData()
    const id = setInterval(fetchData, 30 * 1000)
    return () => clearInterval(id)
  }, [lastAlert])

  return null
}
