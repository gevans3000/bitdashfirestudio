export interface BookWall {
  price: number;
  qty: number;
}

export function detectWall(levels: [string, string][]): BookWall | null {
  if (!levels.length) return null;
  const avg =
    levels.reduce((sum, [, qty]) => sum + parseFloat(qty), 0) / levels.length;
  for (const [price, qty] of levels) {
    const q = parseFloat(qty);
    if (q >= avg * 3) return { price: parseFloat(price), qty: q };
  }
  return null;
}
