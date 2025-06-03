export interface LiquidationCluster {
  ts: number
  buyQty: number
  sellQty: number
}

export function createLiqClusterAggregator(
  onCluster: (c: LiquidationCluster) => void,
  bucketMs = 60_000,
) {
  let currentBucket = 0
  let buy = 0
  let sell = 0

  return (e: { side: 'Buy' | 'Sell'; qty: number; ts: number }): void => {
    const bucket = Math.floor(e.ts / bucketMs) * bucketMs
    if (currentBucket === 0) currentBucket = bucket
    if (bucket !== currentBucket) {
      onCluster({ ts: currentBucket, buyQty: buy, sellQty: sell })
      currentBucket = bucket
      buy = 0
      sell = 0
    }
    if (e.side === 'Buy') buy += e.qty
    else sell += e.qty
  }
}
