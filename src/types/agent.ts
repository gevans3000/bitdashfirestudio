export interface AgentMessage<T = any> {
  from: AgentRole;
  to: AgentRole | 'broadcast';
  type: string;
  payload: T;
  ts: number; // epoch ms
}

export type AgentRole =
  | 'Orchestrator'
  | 'DataCollector'
  | 'IndicatorEngine'
  | 'SignalGenerator'
  | 'AlertLogger';
