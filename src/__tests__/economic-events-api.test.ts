
describe('economic events api', () => {
  it('returns high impact events', async () => {
    const mock = [
      { date: '2025-06-05', event: 'CPI', impact: 'High', country: 'US' },
      { date: '2025-06-05', event: 'Other', impact: 'Medium', country: 'US' },
    ]
    const fetchSpy = jest
      .spyOn(global, 'fetch' as any)
      .mockResolvedValue({ ok: true, json: async () => mock } as any)
    let mod: any
    jest.isolateModules(() => {
      mod = require('../app/api/economic-events/route')
    })
    const res = await mod.GET()
    const json = await res.json()
    expect(json.events).toEqual([mock[0]])
    fetchSpy.mockRestore()
  })
})
