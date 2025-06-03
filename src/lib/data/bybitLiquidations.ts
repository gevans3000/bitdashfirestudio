export interface LiquidationEvent {
  symbol: string;
  side: 'Buy' | 'Sell';
  price: number;
  qty: number;
  time: number;
}

export type LiquidationHandler = (ev: LiquidationEvent) => void;

export function connectBybitLiquidations(handler: LiquidationHandler): () => void {
  const url = 'wss://stream.bybit.com/v5/public/linear';
  const ws = new WebSocket(url);
  ws.onopen = () => {
    ws.send(JSON.stringify({ op: 'subscribe', args: ['publicTrade.lt.BTCUSDT'] }));
  };
  ws.onmessage = ev => {
    try {
      const data = JSON.parse(ev.data);
      const tick = data.data?.[0];
      if (tick && tick.symbol && tick.side && tick.price && tick.qty && tick.ts) {
        handler({
          symbol: tick.symbol,
          side: tick.side,
          price: parseFloat(tick.price),
          qty: parseFloat(tick.qty),
          time: tick.ts,
        });
      }
    } catch (e) {
      console.error('bybit liq parse error', e);
    }
  };
  ws.onerror = () => ws.close();
  ws.onclose = () => {};
  return () => ws.close();
}
