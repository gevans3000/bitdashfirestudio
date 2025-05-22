import axios from 'axios';

// Cache for rate limiting
let lastFetchTime = 0;
const MIN_FETCH_INTERVAL = 1000; // 1 second between API calls

async function fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<any> {
  try {
    await new Promise(resolve => 
      setTimeout(resolve, Math.max(0, MIN_FETCH_INTERVAL - (Date.now() - lastFetchTime)))
    );
    
    const response = await axios.get(url);
    lastFetchTime = Date.now();
    return response.data;
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(url, retries - 1, delay * 2);
  }
}

// Data validation
const DXY_RANGE = { min: 70, max: 120 };
const US10Y_RANGE = { min: 0, max: 20 };

export function validateTreasuryYield(yieldValue: number): boolean {
  return !isNaN(yieldValue) && yieldValue >= US10Y_RANGE.min && yieldValue <= US10Y_RANGE.max;
}

export function validateDXY(dxyValue: number): boolean {
  return !isNaN(dxyValue) && dxyValue >= DXY_RANGE.min && dxyValue <= DXY_RANGE.max;
}

// Fetch DXY from multiple sources
export async function fetchDXY(): Promise<{ value: number; source: string }> {
  const sources = [
    {
      name: 'FRED',
      fetch: async () => {
        const url = `https://api.stlouisfed.org/fred/series/observations?series_id=DTWEXBGS&api_key=${process.env.NEXT_PUBLIC_FRED_API_KEY}&file_type=json&limit=1&sort_order=desc`;
        const data = await fetchWithRetry(url);
        const value = parseFloat(data?.observations?.[0]?.value);
        return { value, valid: validateDXY(value) };
      }
    },
    {
      name: 'Financial Modeling Prep',
      fetch: async () => {
        const url = `https://financialmodelingprep.com/api/v3/quote/DXY?apikey=${process.env.NEXT_PUBLIC_FMP_API_KEY}`;
        const data = await fetchWithRetry(url);
        const value = data?.[0]?.price;
        return { value, valid: validateDXY(value) };
      }
    }
  ];

  for (const source of sources) {
    try {
      const { value, valid } = await source.fetch();
      if (valid) {
        return { value, source: source.name };
      }
    } catch (error) {
      console.warn(`Failed to fetch DXY from ${source.name}:`, error);
    }
  }
  
  throw new Error('Failed to fetch DXY from all sources');
}

// Fetch 10-Year Treasury Yield from multiple sources
export async function fetchUS10Y(): Promise<{ value: number; source: string }> {
  const today = new Date().toISOString().split('T')[0];
  const sources = [
    {
      name: 'FRED',
      fetch: async () => {
        const url = `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${process.env.NEXT_PUBLIC_FRED_API_KEY}&file_type=json&limit=1&sort_order=desc`;
        const data = await fetchWithRetry(url);
        const value = parseFloat(data?.observations?.[0]?.value);
        return { value, valid: validateTreasuryYield(value) };
      }
    },
    {
      name: 'Financial Modeling Prep',
      fetch: async () => {
        const url = `https://financialmodelingprep.com/api/v4/treasury?from=${today}&to=${today}&apikey=${process.env.NEXT_PUBLIC_FMP_API_KEY}`;
        const data = await fetchWithRetry(url);
        const value = parseFloat(data?.[0]?.['10Y']);
        return { value, valid: validateTreasuryYield(value) };
      }
    }
  ];

  for (const source of sources) {
    try {
      const { value, valid } = await source.fetch();
      if (valid) {
        return { value, source: source.name };
      }
    } catch (error) {
      console.warn(`Failed to fetch US10Y from ${source.name}:`, error);
    }
  }
  
  throw new Error('Failed to fetch US10Y from all sources');
}
