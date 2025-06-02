'use client';
import { useEffect, useState } from 'react';
import DataCard from '@/components/DataCard';

interface FundingResp {
  rate: number;
  fundingTime: number;
  status: string;
}

export default function FundingRateWidget() {
  const [data, setData] = useState<FundingResp | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/funding-rate');
        if (!res.ok) throw new Error('API error');
        setData(await res.json());
      } catch (e) {
        console.error('Funding rate fetch failed', e);
      }
    };
    fetchData();
    const id = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const value = data ? data.rate : 0;
  const color = value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : '';

  return (
    <DataCard title="Funding Rate">
      {data ? (
        <div className="text-center space-y-1">
          <p className={`text-2xl font-bold ${color}`}>{value.toFixed(4)}%</p>
        </div>
      ) : (
        <p className="text-center p-4">Loading funding rate...</p>
      )}
    </DataCard>
  );
}
