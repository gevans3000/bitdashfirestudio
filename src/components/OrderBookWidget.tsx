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
    const id = setInterval(fetchData, 30000); // reduce polling frequency
    return () => clearInterval(id);
  }, []);

  const calcTotal = (arr: [string, string][]) =>
    arr.reduce((sum, [price, qty]) => sum + parseFloat(qty), 0);
  const bidTotal = data ? calcTotal(data.bids) : 0;
  const askTotal = data ? calcTotal(data.asks) : 0;
  const imbalance =
    bidTotal && askTotal ? (bidTotal > askTotal ? 'Buy Wall' : 'Sell Wall') : '';

  const normalizeDepth = (orders: [string, string][]) =>
    orders.map(([p, q]) => ({ price: parseFloat(p), qty: parseFloat(q) }));
  const bids = data ? normalizeDepth(data.bids).slice(0, 5) : [];
  const asks = data ? normalizeDepth(data.asks).slice(0, 5) : [];
  const maxBid = Math.max(...bids.map(b => b.qty), 0);
  const maxAsk = Math.max(...asks.map(a => a.qty), 0);

  return (
    <DataCard title="Order Book Depth" className="sm:col-span-2 lg:col-span-2">
      {data ? (
        <>
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
            <p className="text-center text-xs mt-2 font-medium">{imbalance}</p>
          )}
          <div className="flex justify-around mt-2 text-xs">
            <table className="w-1/2">
              <tbody>
                {bids.map(b => (
                  <tr
                    key={`bid-${b.price}`}
                    className={b.qty === maxBid ? 'bg-green-100' : ''}
                  >
                    <td className="px-1 text-right">{b.price.toFixed(2)}</td>
                    <td className="px-1 text-right">{b.qty.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="w-1/2">
              <tbody>
                {asks.map(a => (
                  <tr
                    key={`ask-${a.price}`}
                    className={a.qty === maxAsk ? 'bg-red-100' : ''}
                  >
                    <td className="px-1 text-right">{a.price.toFixed(2)}</td>
                    <td className="px-1 text-right">{a.qty.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-center p-4">Loading depth...</p>
      )}
    </DataCard>
  );
}
