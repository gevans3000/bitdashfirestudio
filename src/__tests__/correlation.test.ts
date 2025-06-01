import { correlation } from '../lib/correlation';

describe('correlation', () => {
  it('positive correlation', () => {
    const val = correlation([1, 2, 3], [2, 4, 6]);
    expect(val).toBeGreaterThan(0.99);
  });

  it('zero correlation when arrays differ', () => {
    const val = correlation([1, 1, 1], [2, 3, 4]);
    expect(val).toBeCloseTo(0);
  });
});
