import { bollingerBands, exponentialMovingAverage, rsi, volumeSMA } from '@/lib/indicators';
import thresholds from '@/config/signals.json';
import type { TradeSignal } from '@/types';

export interface IndicatorSet {
  close: number;
  volume: number;
  closes: number[];
  volumes: number[];
  ts: number;
}

export interface ComputedIndicators {
  emaFast: number;
  emaSlow: number;
  rsi: number;
  bbUpper: number;
  bbLower: number;
  volumeSma: number;
}

export function computeIndicators(data: IndicatorSet): ComputedIndicators {
  const emaFast = exponentialMovingAverage(data.closes, thresholds.emaFast);
  const emaSlow = exponentialMovingAverage(data.closes, thresholds.emaSlow);
  const rsiVal = rsi(data.closes, thresholds.rsiPeriod);
  const bb = bollingerBands(data.closes, thresholds.bbPeriod, thresholds.bbStdDev);
  const volSma = volumeSMA(data.volumes, 20);
  return { emaFast, emaSlow, rsi: rsiVal, bbUpper: bb.upper, bbLower: bb.lower, volumeSma: volSma };
}

export function evaluateSignal(
  prev: ComputedIndicators | null,
  curr: ComputedIndicators,
  price: number,
  volume: number,
  lastSignalTs: number
): TradeSignal | null {
  const now = curr;
  const cooldown = thresholds.signalCooldownMin * 60 * 1000;
  const ts = Date.now();
  if (ts - lastSignalTs < cooldown) return null;
  if (volume < curr.volumeSma * thresholds.volumeMult) return null;

  if (prev) {
    const crossUp = prev.emaFast < prev.emaSlow && curr.emaFast > curr.emaSlow;
    const crossDown = prev.emaFast > prev.emaSlow && curr.emaFast < curr.emaSlow;
    if (crossUp) {
      return { asset: 'BTC', interval: '5m', type: 'BUY', reason: 'EMA crossover', price, ts };
    }
    if (crossDown) {
      return { asset: 'BTC', interval: '5m', type: 'SELL', reason: 'EMA crossover', price, ts };
    }
  }

  if (price <= curr.bbLower && curr.rsi < thresholds.rsiBuy) {
    return { asset: 'BTC', interval: '5m', type: 'BUY', reason: 'BB + RSI', price, ts };
  }
  if (price >= curr.bbUpper && curr.rsi > thresholds.rsiSell) {
    return { asset: 'BTC', interval: '5m', type: 'SELL', reason: 'BB + RSI', price, ts };
  }
  return null;
}
