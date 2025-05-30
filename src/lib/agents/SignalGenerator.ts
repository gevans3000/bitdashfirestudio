import { AgentMessage } from '@/types/agent';
import type { TradeSignal } from '@/types';
import { evaluateSignal } from '@/lib/signals';
import { Orchestrator } from './Orchestrator';

export class SignalGenerator {
  private prev: any = null;
  private lastSignal = 0;

  constructor(private bus: Orchestrator) {}

  handle(msg: AgentMessage<any>): void {
    if (msg.type !== 'INDICATORS_5M') return;
    const indicators = msg.payload;
    const signal = evaluateSignal(this.prev, indicators, indicators.close, indicators.volume, this.lastSignal);
    this.prev = indicators;
    if (signal) {
      this.lastSignal = signal.ts;
      const out: AgentMessage<TradeSignal> = {
        from: 'SignalGenerator',
        to: 'broadcast',
        type: signal.type === 'BUY' ? 'SIGNAL_BUY' : 'SIGNAL_SELL',
        payload: signal,
        ts: signal.ts,
      };
      this.bus.send(out);
    }
  }
}
