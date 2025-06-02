'use client';
import { useEffect, useState } from 'react';
import DataCard from '@/components/DataCard';

interface VwapResp {
  vwap: number;
  deviationPct: number;
  status: string;
}

export default function VwapWidget() {
  const [data, setData] = useState<VwapResp | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/vwap');
        if (!res.ok) throw new Error('API error');
        setData(await res.json());
      } catch (e) {
        console.error('VWAP fetch failed', e);
      }
    };
    fetchData();
    const id = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const deviation = data ? data.deviationPct : 0;
  const deviationColor = deviation > 0 ? 'text-green-600' : 'text-red-600';

  return (
    <DataCard title="BTC VWAP">
      {data ? (
        <div className="text-center space-y-1">
          <p className="text-2xl font-bold">{data.vwap.toFixed(2)}</p>
          <p className={`text-sm font-medium ${deviationColor}`}>{deviation.toFixed(2)}%</p>
        </div>
      ) : (
        <p className="text-center p-4">Loading VWAP...</p>
      )}
    </DataCard>
  );
}
