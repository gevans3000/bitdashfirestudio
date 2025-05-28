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

