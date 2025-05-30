import { exponentialMovingAverage, rsi, bollingerBands, volumeSMA } from '../lib/indicators';

describe('indicator calculations', () => {
  it('ema', () => {
    const ema = exponentialMovingAverage([1,2,3,4,5], 3);
    expect(ema).toBeGreaterThan(0);
  });
  it('rsi', () => {
    const val = rsi([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], 14);
    expect(val).toBeGreaterThanOrEqual(0);
  });
  it('bollinger', () => {
    const bb = bollingerBands([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20], 20, 2);
    expect(bb.upper).toBeGreaterThan(bb.lower);
  });
  it('volumeSMA', () => {
    const val = volumeSMA([1,2,3,4,5], 3);
    expect(val).toBeGreaterThan(0);
  });
});
