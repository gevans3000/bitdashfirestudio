import axios from "axios";

// Cache for rate limiting
let lastFetchTime = 0;
const MIN_FETCH_INTERVAL = 1000; // 1 second between API calls

async function fetchWithRetry(
  url: string,
  retries = 2,
  delay = 1000,
): Promise<any> {
  try {
    await new Promise((resolve) =>
      setTimeout(
        resolve,
        Math.max(0, MIN_FETCH_INTERVAL - (Date.now() - lastFetchTime)),
      ),
    );

    const response = await axios.get(url, { timeout: 5000 });
    lastFetchTime = Date.now();

    if (!response.data) {
      throw new Error("Empty response data");
    }

    return response.data;
  } catch (error) {
    console.warn(`API call failed (${retries} retries left):`, error.message);
    if (retries <= 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, retries - 1, delay * 2);
  }
}

// Data validation
const DXY_RANGE = { min: 70, max: 120 };
const US10Y_RANGE = { min: 0, max: 20 };

export function validateTreasuryYield(yieldValue: number): boolean {
  return (
    !isNaN(yieldValue) &&
    yieldValue >= US10Y_RANGE.min &&
    yieldValue <= US10Y_RANGE.max
  );
}

export function validateDXY(dxyValue: number): boolean {
  return (
    !isNaN(dxyValue) && dxyValue >= DXY_RANGE.min && dxyValue <= DXY_RANGE.max
  );
}

// Fetch DXY from multiple sources
// Cache for DXY data
let cachedDXY: { value: number; source: string; timestamp: number } | null =
  null;

export async function fetchDXY(): Promise<{ value: number; source: string }> {
  // Return cached data if it's fresh (less than 15 minutes old)
  if (cachedDXY && Date.now() - cachedDXY.timestamp < 900000) {
    return { value: cachedDXY.value, source: `${cachedDXY.source} (cached)` };
  }

  const sources = [
    {
      name: "FRED",
      fetch: async () => {
        const url = `https://api.stlouisfed.org/fred/series/observations?series_id=DTWEXBGS&api_key=${process.env.NEXT_PUBLIC_FRED_API_KEY}&file_type=json&limit=1&sort_order=desc`;
        const data = await fetchWithRetry(url);
        const value = parseFloat(data?.observations?.[0]?.value);
        return { value, valid: validateDXY(value) };
      },
    },
    {
      name: "Financial Modeling Prep",
      fetch: async () => {
        const url = `https://financialmodelingprep.com/api/v3/quote/DXY?apikey=${process.env.NEXT_PUBLIC_FMP_API_KEY}`;
        const data = await fetchWithRetry(url);
        const value = data?.[0]?.price;
        return { value, valid: validateDXY(value) };
      },
    },
  ];

  // Try to get from localStorage if no fresh cache
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("dxy_cache");
      if (cached) {
        const { value, source, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 86400000) {
          // 24 hours
          return { value, source: `${source} (cached)` };
        }
      }
    } catch (e) {
      console.warn("Error reading DXY from cache:", e);
    }
  }

  // Try to fetch from all sources
  for (const source of sources) {
    try {
      const { value, valid } = await source.fetch();
      if (valid) {
        // Update cache
        cachedDXY = { value, source: source.name, timestamp: Date.now() };
        if (typeof window !== "undefined") {
          localStorage.setItem("dxy_cache", JSON.stringify(cachedDXY));
        }
        return { value, source: source.name };
      }
    } catch (error) {
      console.warn(`Failed to fetch DXY from ${source.name}:`, error);
    }
  }

  // If all sources fail, try to return the last known good value if available
  if (cachedDXY) {
    return {
      value: cachedDXY.value,
      source: `${cachedDXY.source} (last known value)`,
    };
  }

  throw new Error(
    "Failed to fetch DXY from all sources and no cache available",
  );
}

// Fetch 10-Year Treasury Yield from multiple sources
// Cache for US10Y data
let cachedUS10Y: { value: number; source: string; timestamp: number } | null =
  null;

export async function fetchUS10Y(): Promise<{ value: number; source: string }> {
  // Return cached data if it's fresh (less than 1 hour old)
  if (cachedUS10Y && Date.now() - cachedUS10Y.timestamp < 3600000) {
    return {
      value: cachedUS10Y.value,
      source: `${cachedUS10Y.source} (cached)`,
    };
  }

  const today = new Date().toISOString().split("T")[0];
  const sources = [
    {
      name: "FRED",
      fetch: async () => {
        const url = `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${process.env.NEXT_PUBLIC_FRED_API_KEY}&file_type=json&limit=1&sort_order=desc`;
        const data = await fetchWithRetry(url);
        const value = parseFloat(data?.observations?.[0]?.value);
        return { value, valid: validateTreasuryYield(value) };
      },
    },
    {
      name: "Financial Modeling Prep",
      fetch: async () => {
        const url = `https://financialmodelingprep.com/api/v4/treasury?from=${today}&to=${today}&apikey=${process.env.NEXT_PUBLIC_FMP_API_KEY}`;
        const data = await fetchWithRetry(url);
        const value = parseFloat(data?.[0]?.["10Y"]);
        return { value, valid: validateTreasuryYield(value) };
      },
    },
  ];

  // Try to get from localStorage if no fresh cache
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("us10y_cache");
      if (cached) {
        const { value, source, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 86400000) {
          // 24 hours
          return { value, source: `${source} (cached)` };
        }
      }
    } catch (e) {
      console.warn("Error reading US10Y from cache:", e);
    }
  }

  // Try to fetch from all sources
  for (const source of sources) {
    try {
      const { value, valid } = await source.fetch();
      if (valid) {
        // Update cache
        cachedUS10Y = { value, source: source.name, timestamp: Date.now() };
        if (typeof window !== "undefined") {
          localStorage.setItem("us10y_cache", JSON.stringify(cachedUS10Y));
        }
        return { value, source: source.name };
      }
    } catch (error) {
      console.warn(`Failed to fetch US10Y from ${source.name}:`, error);
    }
  }

  // If all sources fail, try to return the last known good value if available
  if (cachedUS10Y) {
    return {
      value: cachedUS10Y.value,
      source: `${cachedUS10Y.source} (last known value)`,
    };
  }

  throw new Error(
    "Failed to fetch US10Y from all sources and no cache available",
  );
}
import { fetchBackfill } from './data/coingecko';
import { fetchIntradayPrices } from './data/fmp';
import { correlation } from './correlation';

export async function fetchBtcLastHour(): Promise<number[]> {
  const candles = await fetchBackfill();
  return candles.slice(-12).map((c) => c.c);
}

// Returns correlation values for BTC vs SPX/SPY over the last hour
export async function fetchLastHourCorrelation(): Promise<
  Array<{ pair: string; value: number }>
> {
  const [btc, spy, spx] = await Promise.all([
    fetchBtcLastHour(),
    fetchIntradayPrices('SPY'),
    fetchIntradayPrices('^GSPC'),
  ]);
  const btcSpx = correlation(btc, spx);
  const btcSpy = correlation(btc, spy);
  const spxSpy = correlation(spx, spy);
  return [
    { pair: 'BTC/SPX', value: btcSpx },
    { pair: 'BTC/SPY', value: btcSpy },
    { pair: 'SPX/SPY', value: spxSpy },
  ];
}
