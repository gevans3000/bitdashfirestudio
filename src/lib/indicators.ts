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

