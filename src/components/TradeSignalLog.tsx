"use client";
import { useEffect, useRef, useState } from "react";
import DataCard from "@/components/DataCard";
import type { TradeSignal } from "@/types";
import { connectBinanceWs, type Candle } from "@/lib/data/binanceWs";
import { computeIndicators, evaluateSignal } from "@/lib/signals";

export default function TradeSignalLog() {
  const [signals, setSignals] = useState<TradeSignal[]>([]);
  const closes = useRef<number[]>([]);
  const volumes = useRef<number[]>([]);
  const prevIndicators = useRef<ReturnType<typeof computeIndicators> | null>(
    null,
  );
  const lastSignalTs = useRef(0);

  useEffect(() => {
    const stop = connectBinanceWs((c: Candle) => {
      closes.current.push(c.close);
      volumes.current.push(c.volume);
      const indicators = computeIndicators({
        close: c.close,
        volume: c.volume,
        closes: closes.current,
        volumes: volumes.current,
        ts: c.closeTime,
      });
      const sig = evaluateSignal(
        prevIndicators.current,
        indicators,
        c.close,
        c.volume,
        lastSignalTs.current,
      );
      prevIndicators.current = indicators;
      if (sig) {
        setSignals((s) => [...s.slice(-19), sig]);
        lastSignalTs.current = sig.ts;
      }
    });
    return () => stop();
  }, []);

  return (
    <DataCard title="Trade Signals">
      {signals.length === 0 ? (
        <p className="p-2 text-center">Waiting for signals...</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {signals.map((s) => (
            <li key={s.ts} className="flex justify-between">
              <span>{new Date(s.ts).toLocaleTimeString()}</span>
              <span>{s.type}</span>
              <span>{s.reason}</span>
              <span>{s.price.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}
    </DataCard>
  );
}
