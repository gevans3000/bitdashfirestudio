'use client';
import { useEffect, useState } from 'react';
import type { TradeSignal } from '@/types';

export default function SignalHistory() {
  const [signals, setSignals] = useState<TradeSignal[]>([]);

  useEffect(() => {
    const load = () => {
      const stored = localStorage.getItem('windsurf-signals');
      setSignals(stored ? JSON.parse(stored) : []);
    };
    load();
    window.addEventListener('windsurf-signal', load);
    return () => window.removeEventListener('windsurf-signal', load);
  }, []);

  return (
    <details className="text-sm">
      <summary className="cursor-pointer">Latest Signals</summary>
      <ul className="mt-2 space-y-1">
        {signals.map((s, i) => (
          <li key={i} className="flex justify-between">
            <span>{new Date(s.ts).toLocaleTimeString()}</span>
            <span className={s.type === 'BUY' ? 'text-green-600' : 'text-red-600'}>{s.type}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
