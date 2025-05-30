import { AgentMessage } from '@/types/agent';
import type { TradeSignal } from '@/types';

export class AlertLogger {
  handle(msg: AgentMessage<TradeSignal>): void {
    if (!msg.type.startsWith('SIGNAL_')) return;
    if (typeof window === 'undefined') return;
    try {
      const existing = JSON.parse(localStorage.getItem('windsurf-signals') || '[]');
      existing.unshift(msg.payload);
      const trimmed = existing.slice(0, 10);
      localStorage.setItem('windsurf-signals', JSON.stringify(trimmed));
      window.dispatchEvent(new Event('windsurf-signal'));
    } catch (e) {
      console.error('Failed to log signal', e);
    }
  }
}
