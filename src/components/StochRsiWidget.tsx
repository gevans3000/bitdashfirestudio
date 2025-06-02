'use client';
import { useEffect, useState } from 'react';
import DataCard from '@/components/DataCard';

interface StochResp {
  stoch: number;
  status: string;
}

export default function StochRsiWidget() {
  const [data, setData] = useState<StochResp | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/stoch-rsi');
        if (!res.ok) throw new Error('API error');
        setData(await res.json());
      } catch (e) {
        console.error('Stoch RSI fetch failed', e);
      }
    };
    fetchData();
    const id = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const value = data ? data.stoch : 50;
  let label: string | null = null;
  if (value >= 80) label = 'Overbought';
  else if (value <= 20) label = 'Oversold';

  return (
    <DataCard title="Stoch RSI">
      {data ? (
        <div className="text-center space-y-1">
          <p className="text-2xl font-bold">{value.toFixed(2)}</p>
          {label && (
            <p className="text-sm font-medium text-red-600">{label}</p>
          )}
        </div>
      ) : (
        <p className="text-center p-4">Loading Stoch RSI...</p>
      )}
    </DataCard>
  );
}
