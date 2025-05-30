'use client';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import DataCard from '@/components/DataCard';
import type { TradeSignal } from '@/types';

export default function SignalCard() {
  const [signal, setSignal] = useState<TradeSignal | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('windsurf-signals');
    if (stored) {
      const arr: TradeSignal[] = JSON.parse(stored);
      setSignal(arr[0]);
    }
    const handler = () => {
      const arr: TradeSignal[] = JSON.parse(localStorage.getItem('windsurf-signals') || '[]');
      setSignal(arr[0]);
      if (arr[0]) {
        toast({
          title: arr[0].type,
          description: arr[0].reason,
        });
      }
    };
    window.addEventListener('windsurf-signal', handler);
    return () => window.removeEventListener('windsurf-signal', handler);
  }, []);

  return (
    <DataCard title="BTC 5m Signal">
      {signal ? (
        <div className="text-center py-4">
          <p className="text-2xl font-bold">{signal.type}</p>
          <p className="text-sm text-muted-foreground">{signal.reason}</p>
          <p className="text-sm">@ {signal.price.toFixed(2)}</p>
        </div>
      ) : (
        <p className="text-center p-4">No signals yet.</p>
      )}
    </DataCard>
  );
}
