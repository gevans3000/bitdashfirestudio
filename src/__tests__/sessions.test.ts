import { getSession, nyseCountdown } from '../lib/marketSessions'

describe('market sessions utils', () => {
  it('detects asia session', () => {
    const date = new Date('2025-01-01T02:00:00Z')
    expect(getSession(date)).toBe('Asia')
  })
  it('countdown before nyse open', () => {
    const date = new Date('2025-01-01T13:00:00Z')
    const result = nyseCountdown(date)
    expect(result.label).toBe('Opens in')
    expect(result.seconds).toBeGreaterThan(0)
  })
})
