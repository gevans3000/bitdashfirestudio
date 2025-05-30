import { computeIndicators, evaluateSignal } from '../lib/signals';

describe('signal logic', () => {
  it('generates signal when crossover', () => {
    const prev = { emaFast: 1, emaSlow: 2, rsi: 50, bbUpper: 2, bbLower: 0, volumeSma: 1 };
    const curr = { emaFast: 3, emaSlow: 2, rsi: 50, bbUpper: 4, bbLower: 2, volumeSma: 1 };
    const sig = evaluateSignal(prev, curr, 3, 2, 0);
    expect(sig?.type).toBe('BUY');
  });
});
