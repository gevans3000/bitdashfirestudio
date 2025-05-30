import { fetchBackfill } from '@/lib/data/coingecko';
import { computeIndicators, evaluateSignal, ComputedIndicators } from '@/lib/signals';
import type { TradeSignal } from '@/types';

async function run() {
  const candles = await fetchBackfill();
  const closes: number[] = [];
  const volumes: number[] = [];
  let prev: ComputedIndicators | null = null;
  let lastSignal = 0;
  const signals: TradeSignal[] = [];
  for (const c of candles) {
    closes.push(c.c);
    volumes.push(c.v);
    const indicators = computeIndicators({ close: c.c, volume: c.v, closes, volumes, ts: c.t });
    const sig = evaluateSignal(prev, indicators, c.c, c.v, lastSignal);
    if (sig) {
      lastSignal = sig.ts;
      signals.push(sig);
    }
    prev = indicators;
  }
  console.log('Signals generated', signals.length);
}

run().catch(e => console.error(e));
