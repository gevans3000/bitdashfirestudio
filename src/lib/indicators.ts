export function simpleMovingAverage(data: number[], period: number): number {
  if (data.length < period) {
    const slice = data.slice()
    const sum = slice.reduce((a, b) => a + b, 0)
    return sum / slice.length
  }
  const recent = data.slice(data.length - period)
  const sum = recent.reduce((a, b) => a + b, 0)
  return sum / period
}

export function rsi(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50
  let gains = 0
  let losses = 0

  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1]
    if (diff > 0) gains += diff
    else losses -= diff
  }

  if (losses === 0) return 100
  const rs = gains / losses
  return 100 - 100 / (1 + rs)
}

export function exponentialMovingAverage(data: number[], period: number): number {
  if (data.length === 0) return 0
  const slice = data.slice(-period)
  const k = 2 / (period + 1)
  let ema = slice[0]
  for (let i = 1; i < slice.length; i++) {
    ema = slice[i] * k + ema * (1 - k)
  }
  return ema
}

export function calculateVolumeProfile(
  prices: number[],
  volumes: number[],
  bins = 10
): Array<{ price: number; volume: number }> {
  if (prices.length !== volumes.length) {
    throw new Error('Price and volume arrays must be the same length')
  }
  if (prices.length === 0) return []
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const binSize = (maxPrice - minPrice) / bins
  const buckets = Array.from({ length: bins }, () => 0)
  for (let i = 0; i < prices.length; i++) {
    const idx = Math.min(
      bins - 1,
      Math.floor((prices[i] - minPrice) / binSize)
    )
    buckets[idx] += volumes[i]
  }
  return buckets.map((volume, idx) => ({
    price: minPrice + binSize * idx + binSize / 2,
    volume,
  }))
}
