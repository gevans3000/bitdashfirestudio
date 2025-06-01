export interface OrderBookWall {
  price: number
  qty: number
}

export function detectWall(levels: [string, string][]): OrderBookWall | null {
  if (levels.length === 0) return null
  const amounts = levels.map(l => parseFloat(l[1]))
  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length
  const threshold = avg * 3
  for (const [priceStr, qtyStr] of levels) {
    const qty = parseFloat(qtyStr)
    if (qty >= threshold) {
      return { price: parseFloat(priceStr), qty }
    }
  }
  return null
}
