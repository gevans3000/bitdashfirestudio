import { AgentMessage } from '@/types/agent'

export type TestMode = 'qa' | 'backtest'

export class TestingAgent {
  private mode: TestMode

  constructor(mode: TestMode = 'qa') {
    this.mode = mode
  }

  setMode(mode: TestMode): void {
    this.mode = mode
  }

  handle(_msg: AgentMessage): void {
    if (this.mode === 'qa') {
      // QA testing logic would go here
    } else {
      // Backtesting logic would go here
    }
  }
}
