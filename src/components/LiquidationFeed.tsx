'use client'
import { useEffect, useState } from 'react'
import DataCard from '@/components/DataCard'

interface LqEvent {
  side: 'Buy' | 'Sell'
  price: number
  qty: number
}

export default function LiquidationFeed() {
  const [events, setEvents] = useState<LqEvent[]>([])

  useEffect(() => {
    const ws = new WebSocket('wss://stream.bybit.com/v5/public/linear')
    ws.onopen = () => {
      ws.send(JSON.stringify({ op: 'subscribe', args: ['liquidation.BTCUSDT'] }))
    }
    ws.onmessage = ev => {
      try {
        const msg = JSON.parse(ev.data)
        if (msg.topic?.startsWith('liquidation') && msg.data) {
          const d = msg.data
          const side = d.side === 'Sell' ? 'Sell' : 'Buy'
          const price = parseFloat(d.price)
          const qty = parseFloat(d.qty)
          setEvents(prev => [...prev.slice(-19), { side, price, qty }])
        }
      } catch (e) {
        console.error('liquidation parse error', e)
      }
    }
    return () => ws.close()
  }, [])

  const clusters = events.reduce<Record<string, { side: 'Buy' | 'Sell'; price: number; vol: number }>>( (acc, ev) => {
    const key = `${ev.side}-${Math.round(ev.price)}`
    const existing = acc[key]
    const vol = (existing?.vol || 0) + ev.qty
    acc[key] = { side: ev.side, price: Math.round(ev.price), vol }
    return acc
  }, {})

  const sorted = Object.values(clusters).sort((a, b) => b.vol - a.vol).slice(0, 5)

  return (
    <DataCard title="Liquidation Clusters">
      {sorted.length ? (
        <div className="space-y-1">
          {sorted.map(c => (
            <div
              key={`${c.side}-${c.price}`}
              className="flex justify-between text-xs"
            >
              <span className={c.side === 'Buy' ? 'text-green-600' : 'text-red-600'}>
                {c.side} @ {c.price}
              </span>
              <span>{c.vol.toFixed(0)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center p-4">Waiting for data...</p>
      )}
    </DataCard>
  )
}
