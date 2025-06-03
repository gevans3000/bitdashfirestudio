import { QueryClient } from '@tanstack/react-query';
import { connectBinanceWs, Candle } from '@/lib/data/binanceWs';
import { connectBybitLiquidationWs, LiquidationEvent } from '@/lib/data/bybitLiquidations';
import { createLiqClusterAggregator, LiquidationCluster } from '@/lib/liquidationClusters';
import { fetchBackfill } from '@/lib/data/coingecko';
import { AgentMessage } from '@/types/agent';
import { Orchestrator } from './Orchestrator';

export class DataCollector {
  private qc = new QueryClient();
  private lastCandleTime = 0;
  private stopWs: (() => void) | null = null;
  private stopLiqWs: (() => void) | null = null;
  private agg = createLiqClusterAggregator(c => this.handleCluster(c));

  constructor(private bus: Orchestrator) {}

  start(): void {
    this.stopWs = connectBinanceWs(c => this.handleCandle(c));
    this.stopLiqWs = connectBybitLiquidationWs(e => this.handleLiquidation(e));
    fetchBackfill()
      .then(candles => {
        this.qc.setQueryData('btc-5m', candles);
      })
      .catch(console.error);
  }

  private handleCandle(c: Candle): void {
    const candles = (this.qc.getQueryData<Candle[]>('btc-5m') ?? []).concat(c);
    this.qc.setQueryData('btc-5m', candles);
    if (c.closeTime !== this.lastCandleTime) {
      this.lastCandleTime = c.closeTime;
      const msg: AgentMessage<Candle> = {
        from: 'DataCollector',
        to: 'IndicatorEngine',
        type: 'KLINE_5M',
        payload: c,
        ts: Date.now(),
      };
      this.bus.send(msg);
    }
  }

  private handleLiquidation(e: LiquidationEvent): void {
    this.agg(e);
    const msg: AgentMessage<LiquidationEvent> = {
      from: 'DataCollector',
      to: 'SignalGenerator',
      type: 'LIQUIDATION',
      payload: e,
      ts: Date.now(),
    };
    this.bus.send(msg);
  }

  private handleCluster(c: LiquidationCluster): void {
    const msg: AgentMessage<LiquidationCluster> = {
      from: 'DataCollector',
      to: 'UIRenderer',
      type: 'LIQ_CLUSTER',
      payload: c,
      ts: Date.now(),
    };
    this.bus.send(msg);
  }
}
