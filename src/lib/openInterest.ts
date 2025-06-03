export interface OiPoint {
  ts: number
  oi: number
}

export function computeOiDelta(data: OiPoint[]): number {
  if (data.length < 2) return 0
  const latest = data[data.length - 1].oi
  const prev = data[data.length - 2].oi
  return latest - prev
}
