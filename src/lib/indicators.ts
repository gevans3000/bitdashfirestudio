export function simpleMovingAverage(data: number[], period: number): number {
  if (data.length < period) {
    const slice = data.slice();
    const sum = slice.reduce((a, b) => a + b, 0);
    return sum / slice.length;
  }
  const recent = data.slice(data.length - period);
  const sum = recent.reduce((a, b) => a + b, 0);
  return sum / period;
}

export function rsi(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;

  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

export function exponentialMovingAverage(
  data: number[],
  period: number,
): number {
  if (data.length === 0) return 0;
  const slice = data.slice(-period);
  const k = 2 / (period + 1);
  let ema = slice[0];
  for (let i = 1; i < slice.length; i++) {
    ema = slice[i] * k + ema * (1 - k);
  }
  return ema;
}

export function calculateVolumeProfile(
  prices: number[],
  volumes: number[],
  bins = 10,
): Array<{ price: number; volume: number }> {
  if (prices.length !== volumes.length) {
    throw new Error("Price and volume arrays must be the same length");
  }
  if (prices.length === 0) return [];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const binSize = (maxPrice - minPrice) / bins;
  const buckets = Array.from({ length: bins }, () => 0);
  for (let i = 0; i < prices.length; i++) {
    const idx = Math.min(
      bins - 1,
      Math.floor((prices[i] - minPrice) / binSize),
    );
    buckets[idx] += volumes[i];
  }
  return buckets.map((volume, idx) => ({
    price: minPrice + binSize * idx + binSize / 2,
    volume,
  }));
}

export function bollingerBands(
  closes: number[],
  period: number,
  stdDev: number,
): { upper: number; middle: number; lower: number } {
  const middle = simpleMovingAverage(closes, period);
  const slice = closes.slice(-period);
  const variance =
    slice.reduce((a, c) => a + Math.pow(c - middle, 2), 0) / slice.length;
  const sd = Math.sqrt(variance);
  const upper = middle + sd * stdDev;
  const lower = middle - sd * stdDev;
  return { upper, middle, lower };
}

export function bollingerWidth(
  closes: number[],
  period: number,
  stdDev: number,
): number {
  const { upper, lower } = bollingerBands(closes, period, stdDev);
  if (lower === 0) return 0;
  return ((upper - lower) / lower) * 100;
}

export function volumeSMA(volumes: number[], period: number): number {
  return simpleMovingAverage(volumes, period);
}

export interface OHLC {
  high: number;
  low: number;
  close: number;
}

export function trueRange(curr: OHLC, prevClose: number): number {
  const highLow = curr.high - curr.low;
  const highClose = Math.abs(curr.high - prevClose);
  const lowClose = Math.abs(curr.low - prevClose);
  return Math.max(highLow, highClose, lowClose);
}

export function averageTrueRange(data: OHLC[], period: number): number {
  if (data.length < period + 1) return 0;
  const trs: number[] = [];
  for (let i = data.length - period; i < data.length; i++) {
    const prev = data[i - 1];
    const curr = data[i];
    trs.push(trueRange(curr, prev.close));
  }
  const sum = trs.reduce((a, b) => a + b, 0);
  return sum / period;
}

export function volumeWeightedAveragePrice(
  closes: number[],
  volumes: number[],
  period: number,
): number {
  if (closes.length === 0 || volumes.length === 0) return 0;
  const len = Math.min(period, closes.length, volumes.length);
  const c = closes.slice(-len);
  const v = volumes.slice(-len);
  let pvSum = 0;
  let volSum = 0;
  for (let i = 0; i < len; i++) {
    pvSum += c[i] * v[i];
    volSum += v[i];
  }
  return volSum ? pvSum / volSum : 0;
}

export function stochasticRsi(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  const rsiSeries: number[] = [];
  for (let i = period; i < prices.length; i++) {
    const slice = prices.slice(i - period, i + 1);
    rsiSeries.push(rsi(slice, period));
  }
  const lastRsi = rsiSeries[rsiSeries.length - 1];
  const minRsi = Math.min(...rsiSeries);
  const maxRsi = Math.max(...rsiSeries);
  if (maxRsi === minRsi) return 50;
  return ((lastRsi - minRsi) / (maxRsi - minRsi)) * 100;
}

export interface AggTrade {
  quantity: number;
  isBuyerMaker: boolean;
}

export function cumulativeDelta(trades: AggTrade[]): number {
  return trades.reduce(
    (sum, t) => sum + (t.isBuyerMaker ? -t.quantity : t.quantity),
    0,
  );
}

export function buyPressurePercent(trades: AggTrade[]): number {
  const buyVol = trades.reduce(
    (sum, t) => sum + (t.isBuyerMaker ? 0 : t.quantity),
    0,
  );
  const sellVol = trades.reduce(
    (sum, t) => sum + (t.isBuyerMaker ? t.quantity : 0),
    0,
  );
  const total = buyVol + sellVol;
  return total ? (buyVol / total) * 100 : 0;
}

export type EmaTrend = "bullish" | "bearish" | "mixed";

export function emaCrossoverState(emas: number[]): EmaTrend {
  if (emas.length < 4) return "mixed";
  const [e10, e20, e50, e200] = emas;
  if (e10 > e20 && e20 > e50 && e50 > e200) return "bullish";
  if (e10 < e20 && e20 < e50 && e50 < e200) return "bearish";
  return "mixed";
}
export interface IchimokuLines {
  tenkan: number;
  kijun: number;
  spanA: number;
  spanB: number;
  chikou: number;
}

export function ichimokuCloud(data: OHLC[]): IchimokuLines {
  if (data.length === 0) {
    return { tenkan: 0, kijun: 0, spanA: 0, spanB: 0, chikou: 0 };
  }

  const high = (period: number) => {
    const slice = data.slice(-period);
    return Math.max(...slice.map((c) => c.high));
  };
  const low = (period: number) => {
    const slice = data.slice(-period);
    return Math.min(...slice.map((c) => c.low));
  };
  const sliceLen = (p: number) => Math.min(p, data.length);

  const tenkan = (high(sliceLen(9)) + low(sliceLen(9))) / 2;
  const kijun = (high(sliceLen(26)) + low(sliceLen(26))) / 2;
  const spanA = (tenkan + kijun) / 2;
  const spanB = (high(sliceLen(52)) + low(sliceLen(52))) / 2;
  const chikouIndex = data.length - 26;
  const chikou = chikouIndex >= 0 ? data[chikouIndex].close : data[0].close;

  return { tenkan, kijun, spanA, spanB, chikou };
}

export interface MacdResult {
  macd: number;
  signal: number;
  histogram: number;
}

export function macd(
  prices: number[],
  fast = 12,
  slow = 26,
  signalPeriod = 9,
): MacdResult {
  if (prices.length < slow) {
    return { macd: 0, signal: 0, histogram: 0 };
  }
  const macdSeries: number[] = [];
  for (let i = slow - 1; i < prices.length; i++) {
    const slice = prices.slice(0, i + 1);
    const fastEma = exponentialMovingAverage(slice, fast);
    const slowEma = exponentialMovingAverage(slice, slow);
    macdSeries.push(fastEma - slowEma);
  }
  const macdValue = macdSeries[macdSeries.length - 1];
  const signalValue = exponentialMovingAverage(macdSeries, signalPeriod);
  const histogram = macdValue - signalValue;
  return { macd: macdValue, signal: signalValue, histogram };
}
