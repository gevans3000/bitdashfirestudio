import { NextResponse } from 'next/server'
import { fetchBackfill } from '@/lib/data/coingecko'
import { createLiqClusterAggregator, LiquidationCluster } from '@/lib/liquidationClusters'

export async function GET() {
  const candles = await fetchBackfill()
  const clusters: LiquidationCluster[] = []
  const agg = createLiqClusterAggregator(c => clusters.push(c))
  candles.forEach(c => {
    agg({ side: Math.random() > 0.5 ? 'Buy' : 'Sell', qty: c.v, ts: c.t })
  })
  return NextResponse.json({ clusters })
}
