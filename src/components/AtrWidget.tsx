'use client';
import { useEffect, useState } from 'react';
import DataCard from '@/components/DataCard';

interface AtrResp {
  atr1h: number;
  atr20d: number;
  status: string;
}

export default function AtrWidget() {
  const [data, setData] = useState<AtrResp | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/atr');
        if (!res.ok) throw new Error('API error');
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error('Failed to fetch ATR', e);
      }
    };
    fetchData();
    const id = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const ratio = data && data.atr20d ? data.atr1h / data.atr20d : 0;
  const alert = ratio > 1.5;

  return (
    <DataCard title="BTC 1h ATR">
      {data ? (
        <div className="text-center space-y-1">
          <p className="text-2xl font-bold">{data.atr1h.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">20d Avg {data.atr20d.toFixed(2)}</p>
          {alert && (
            <p className="text-sm text-red-600 font-medium">High volatility</p>
          )}
        </div>
      ) : (
        <p className="text-center p-4">Loading ATR...</p>
      )}
    </DataCard>
  );
}
