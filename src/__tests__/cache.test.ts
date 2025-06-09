import { afterEach, describe, expect, it, jest } from '@jest/globals'

const CACHE_DURATION = 30 * 60 * 1000

afterEach(() => {
  jest.useRealTimers()
  delete (global as any).window
})

describe('cache module', () => {
  it('uses Map fallback when localStorage missing', () => {
    jest.useFakeTimers()
    jest.isolateModules(() => {
      const cache = require('../lib/cache')
      expect(cache.getCachedData('x')).toBeNull()
      cache.setCachedData('x', 1)
      expect(cache.getCachedData('x')).toBe(1)
      jest.advanceTimersByTime(CACHE_DURATION + 1)
      expect(cache.getCachedData('x')).toBeNull()
    })
  })

  it('uses browser localStorage when available', () => {
    const store = new Map<string, string>()
    ;(global as any).window = {
      localStorage: {
        getItem: (k: string) => (store.has(k) ? store.get(k) : null),
        setItem: (k: string, v: string) => {
          store.set(k, v)
        },
        removeItem: (k: string) => {
          store.delete(k)
        },
      },
    }
    jest.useFakeTimers()
    jest.isolateModules(() => {
      const cache = require('../lib/cache')
      expect(cache.getCachedData('y')).toBeNull()
      cache.setCachedData('y', 2)
      expect(cache.getCachedData('y')).toBe(2)
      jest.advanceTimersByTime(CACHE_DURATION + 1)
      expect(cache.getCachedData('y')).toBeNull()
    })
  })
})
