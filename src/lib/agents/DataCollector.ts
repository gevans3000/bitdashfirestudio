import { QueryClient } from '@tanstack/react-query';
import { connectBinanceWs, Candle } from '@/lib/data/binanceWs';
import { fetchBackfill } from '@/lib/data/coingecko';
import { AgentMessage } from '@/types/agent';
import { Orchestrator } from './Orchestrator';

export class DataCollector {
  private qc = new QueryClient();
  private lastCandleTime = 0;
  private stopWs: (() => void) | null = null;

  constructor(private bus: Orchestrator) {}

  start(): void {
    this.stopWs = connectBinanceWs(c => this.handleCandle(c));
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
}
