import { AgentMessage } from '@/types/agent';
import { Candle } from '@/lib/data/binanceWs';
import { computeIndicators, IndicatorSet } from '@/lib/signals';
import { Orchestrator } from './Orchestrator';

export class IndicatorEngine {
  private closes: number[] = [];
  private volumes: number[] = [];
  private previous: ReturnType<typeof computeIndicators> | null = null;

  constructor(private bus: Orchestrator) {}

  handle(msg: AgentMessage<Candle>): void {
    if (msg.type !== 'KLINE_5M') return;
    const candle = msg.payload;
    this.closes.push(candle.close);
    this.volumes.push(candle.volume);
    const indicators = computeIndicators({
      close: candle.close,
      volume: candle.volume,
      closes: this.closes,
      volumes: this.volumes,
      ts: candle.closeTime,
    });
    const out: AgentMessage<typeof indicators> = {
      from: 'IndicatorEngine',
      to: 'SignalGenerator',
      type: 'INDICATORS_5M',
      payload: indicators,
      ts: Date.now(),
    };
    this.bus.send(out);
    this.previous = indicators;
  }
}
