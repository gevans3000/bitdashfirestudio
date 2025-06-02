'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import DataCard from '@/components/DataCard';

interface VolumePoint {
  t: number;
  volume: number;
  spike: boolean;
}

export default function VolumeSpikeChart() {
  const [data, setData] = useState<VolumePoint[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/volume-spikes');
        const json = await res.json();
        setData(json.volumes.slice(-50));
      } catch (e) {
        console.error('Volume spike fetch failed', e);
      }
    };
    fetchData();
    const id = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <DataCard title="Volume Spikes" className="sm:col-span-2 lg:col-span-2">
      {data.length ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="t" tickFormatter={formatTime} minTickGap={20} />
            <Tooltip labelFormatter={(v) => formatTime(Number(v))} />
            <Bar dataKey="volume">
              {data.map((d, idx) => (
                <Cell key={idx} fill={d.spike ? '#dc2626' : '#60a5fa'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center p-4">Loading volume...</p>
      )}
    </DataCard>
  );
}
