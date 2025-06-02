import { AgentMessage, AgentRole } from '@/types/agent';

export type Handler = (msg: AgentMessage) => void;

export class Orchestrator {
  private handlers: Record<AgentRole, Handler> = {
    Orchestrator: () => {},
    DataCollector: () => {},
    IndicatorEngine: () => {},
    SignalGenerator: () => {},
    UIRenderer: () => {},
    AlertLogger: () => {},
    TestingAgent: () => {},
  };

  register(role: AgentRole, handler: Handler): void {
    this.handlers[role] = handler;
  }

  send(msg: AgentMessage): void {
    if (msg.to === 'broadcast') {
      Object.values(this.handlers).forEach(h => h(msg));
    } else {
      const h = this.handlers[msg.to];
      h?.(msg);
    }
  }
}
