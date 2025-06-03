export interface LiquidationEvent {
  symbol: string
  side: 'Buy' | 'Sell'
  price: number
  qty: number
  ts: number
}

export type LiquidationHandler = (e: LiquidationEvent) => void

export function connectBybitLiquidationWs(
  handler: LiquidationHandler,
): () => void {
  const url = 'wss://stream.bybit.com/v5/public/linear'
  let retries = 0
  let ws: WebSocket | null = null

  const subscribeMsg = JSON.stringify({
    op: 'subscribe',
    args: ['liquidation.BTCUSDT'],
  })

  const connect = () => {
    ws = new WebSocket(url)
    ws.onopen = () => {
      ws?.send(subscribeMsg)
    }
    ws.onmessage = evt => {
      try {
        const msg = JSON.parse(evt.data)
        if (msg.topic === 'liquidation.BTCUSDT' && Array.isArray(msg.data)) {
          msg.data.forEach((d: any) => {
            handler({
              symbol: d.symbol,
              side: d.side,
              price: Number(d.price),
              qty: Number(d.qty),
              ts: d.timestamp || Date.now(),
            })
          })
        }
      } catch (e) {
        console.error('Bybit WS parse error', e)
      }
    }
    ws.onclose = () => reconnect()
    ws.onerror = () => {
      ws?.close()
    }
  }

  const reconnect = () => {
    if (retries >= 2) return
    retries += 1
    const delay = Math.pow(2, retries) * 1000
    setTimeout(connect, delay)
  }

  connect()

  return () => {
    ws?.close()
  }
}
