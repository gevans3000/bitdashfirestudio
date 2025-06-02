'use client';
import { useEffect, useState } from 'react';
import DataCard from '@/components/DataCard';

interface BandsResp {
  high: number;
  low: number;
  vwap: number;
  status: string;
}

export default function PrevDayBands() {
  const [data, setData] = useState<BandsResp | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/prev-day');
        if (!res.ok) throw new Error('API error');
        setData(await res.json());
      } catch (e) {
        console.error('Prev-day fetch failed', e);
      }
    };
    fetchData();
    const id = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <DataCard title="Prev Day Bands">
      {data ? (
        <div className="text-center space-y-1">
          <p className="text-xs">High: {data.high.toFixed(2)}</p>
          <p className="text-xs">Low: {data.low.toFixed(2)}</p>
          <p className="text-xs">VWAP: {data.vwap.toFixed(2)}</p>
        </div>
      ) : (
        <p className="text-center p-4">Loading...</p>
      )}
    </DataCard>
  );
}
