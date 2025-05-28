type CacheItem<T> = {
  data: T;
  timestamp: number;
};

const CACHE_PREFIX = 'bitdash_';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const getCachedData = <T>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached) as CacheItem<T>;
    
    // Check if cache is still valid
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
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
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
};

export const clearCache = (): void => {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};
