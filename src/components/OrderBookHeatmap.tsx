'use client';
import { useEffect, useState } from 'react';
import DataCard from '@/components/DataCard';

interface DepthLevel {
  price: number;
  qty: number;
}

export default function OrderBookHeatmap() {
  const [bids, setBids] = useState<DepthLevel[]>([]);
  const [asks, setAsks] = useState<DepthLevel[]>([]);

  useEffect(() => {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@depth20@100ms');
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.bids && data.asks) {
          setBids(data.bids.map((d: [string, string]) => ({ price: parseFloat(d[0]), qty: parseFloat(d[1]) })));
          setAsks(data.asks.map((d: [string, string]) => ({ price: parseFloat(d[0]), qty: parseFloat(d[1]) })));
        }
      } catch (e) {
        console.error('depth parse error', e);
      }
    };
    return () => ws.close();
  }, []);

  const maxQty = Math.max(
    ...bids.map((b) => b.qty),
    ...asks.map((a) => a.qty),
    1
  );

  const renderRows = (levels: DepthLevel[], side: 'bid' | 'ask') =>
    levels.map((l) => {
      const intensity = l.qty / maxQty;
      const highlight = intensity > 0.7;
      return (
        <div
          key={`${side}-${l.price}`}
          className={`flex text-xs ${highlight ? 'ring-2 ring-yellow-400' : ''}`}
          style={{ background: `rgba(${side === 'bid' ? '0,128,0' : '255,0,0'},${intensity})` }}
        >
          <span className="flex-1 pl-1">{l.price.toFixed(2)}</span>
          <span className="w-16 text-right pr-1">{l.qty.toFixed(3)}</span>
        </div>
      );
    });

  return (
    <DataCard title="Order Book Heatmap" className="space-y-1">
      <div className="grid grid-cols-2 gap-2">
        <div>{renderRows(bids, 'bid')}</div>
        <div>{renderRows(asks, 'ask')}</div>
      </div>
    </DataCard>
  );
}
