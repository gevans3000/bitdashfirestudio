'use client';
import { useEffect, useState } from 'react';
import DataCard from '@/components/DataCard';

interface DepthData {
  bids: [string, string][];
  asks: [string, string][];
  status: string;
}

export default function OrderBookWidget() {
  const [data, setData] = useState<DepthData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/orderbook');
        if (!res.ok) throw new Error('API error');
        setData(await res.json());
      } catch (e) {
        console.error('Orderbook fetch failed', e);
      }
    };
    fetchData();
    const id = setInterval(fetchData, 15000);
    return () => clearInterval(id);
  }, []);

  const calcTotal = (arr: [string, string][]) =>
    arr.reduce((sum, [price, qty]) => sum + parseFloat(qty), 0);
  const bidTotal = data ? calcTotal(data.bids) : 0;
  const askTotal = data ? calcTotal(data.asks) : 0;
  const imbalance =
    bidTotal && askTotal ? (bidTotal > askTotal ? 'Buy Wall' : 'Sell Wall') : '';

  const highlightWall = (levels: [string, string][], label: string) => {
    const qtys = levels.map(([, qty]) => parseFloat(qty));
    if (qtys.length === 0) return null;
    const maxQty = Math.max(...qtys);
    const avgQty = qtys.reduce((a, b) => a + b, 0) / qtys.length;
    if (maxQty >= avgQty * 3) {
      const idx = qtys.indexOf(maxQty);
      const price = parseFloat(levels[idx][0]).toFixed(2);
      return `${label} wall at $${price}`;
    }
    return null;
  };

  const wallMsg =
    highlightWall(data?.bids || [], 'Buy') ||
    highlightWall(data?.asks || [], 'Sell') ||
    null;

  return (
    <DataCard title="Order Book Depth" className="sm:col-span-2 lg:col-span-2">
      {data ? (
        <div className="flex justify-around text-sm">
          <div className="text-center">
            <p className="font-medium text-green-600">Bids</p>
            <p>{bidTotal.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="font-medium text-red-600">Asks</p>
            <p>{askTotal.toFixed(2)}</p>
          </div>
        </div>
        {imbalance && (
          <p className="text-center text-xs mt-2 font-medium">
            {imbalance}
          </p>
        )}
        {wallMsg && (
          <p className="text-center text-xs text-yellow-600 mt-1">{wallMsg}</p>
        )}
      ) : (
        <p className="text-center p-4">Loading depth...</p>
      )}
    </DataCard>
  );
}
