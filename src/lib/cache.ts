type CacheItem<T> = {
  data: T;
  timestamp: number;
};

const CACHE_PREFIX = 'bitdash_';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

const inBrowser =
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const memoryCache = new Map<string, CacheItem<unknown>>();

export const getCachedData = <T>(key: string): T | null => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    if (inBrowser) {
      const cached = window.localStorage.getItem(cacheKey);
      if (!cached) return null;
      const { data, timestamp } = JSON.parse(cached) as CacheItem<T>;
      if (Date.now() - timestamp < CACHE_DURATION) return data;
      return null;
    }
    const cached = memoryCache.get(cacheKey) as CacheItem<T> | undefined;
    if (!cached) return null;
    if (Date.now() - cached.timestamp < CACHE_DURATION) return cached.data;
    return null;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
};

export const setCachedData = <T>(key: string, data: T): void => {
  try {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
    };
    const cacheKey = `${CACHE_PREFIX}${key}`;
    if (inBrowser) {
      window.localStorage.setItem(cacheKey, JSON.stringify(item));
    } else {
      memoryCache.set(cacheKey, item);
    }
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
};

export const clearCache = (): void => {
  try {
    if (inBrowser) {
      Object.keys(window.localStorage).forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          window.localStorage.removeItem(key);
        }
      });
    } else {
      for (const key of memoryCache.keys()) {
        if (key.startsWith(CACHE_PREFIX)) memoryCache.delete(key);
      }
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};
