export interface Candle {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

export type CandleHandler = (c: Candle) => void;

export function connectBinanceWs(handler: CandleHandler): () => void {
  const url = 'wss://stream.binance.com:9443/ws/btcusdt@kline_5m';
  let retries = 0;
  let ws: WebSocket | null = null;
  const connect = () => {
    ws = new WebSocket(url);
    ws.onmessage = evt => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.e === 'kline' && msg.k && msg.k.x) {
          const k = msg.k;
          handler({
            openTime: k.t,
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
            volume: parseFloat(k.v),
            closeTime: k.T,
          });
        }
      } catch (e) {
        console.error('WS parse error', e);
      }
    };
    ws.onclose = () => reconnect();
    ws.onerror = () => {
      ws?.close();
    };
  };

  const reconnect = () => {
    if (retries >= 2) return;
    retries += 1;
    const delay = Math.pow(2, retries) * 1000;
    setTimeout(connect, delay);
  };

  connect();

  return () => {
    ws?.close();
  };
}
