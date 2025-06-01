import { NextResponse } from "next/server";

// Caches data for 1 hour
interface CachedData {
  payload: Record<string, any>;
  timestamp: number;
}

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
let cache: CachedData | null = null;

// Fallback data in case API fails
const FALLBACK_US10Y = {
  id: "us10y",
  name: "10-Year Treasury Yield",
  symbol: "US10Y",
  price: 4.25, // Example fallback value
  change: -0.02,
  changePercent: -0.47,
  volume: 0,
  lastUpdated: new Date().toISOString(),
  status: "cached",
  source: "fallback",
};

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Helper function to fetch with retry
async function fetchWithRetry(url: string, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        next: { revalidate: 300 },
        cache: "no-store", // Ensure we don't get cached responses
      });
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed:`, error);
    }
    if (i < retries - 1)
      await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error(`Failed after ${retries} retries`);
}

export async function GET() {
  if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
    return NextResponse.json(
      { ...cache.payload, status: "cached" },
      { headers: corsHeaders },
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_FRED_API_KEY;

  if (!apiKey) {
    console.warn("FRED_API_KEY is not configured, using fallback data");
    return NextResponse.json(FALLBACK_US10Y, {
      headers: corsHeaders,
    });
  }

  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${apiKey}&file_type=json&limit=2&sort_order=desc`;
    const data = await fetchWithRetry(url);
    const obs = data?.observations;
    const latest = parseFloat(obs?.[0]?.value);
    const prev = obs?.[1] ? parseFloat(obs[1].value) : NaN;

    if (isNaN(latest)) {
      throw new Error("Invalid US10Y data from FRED");
    }

    const change = !isNaN(prev) ? latest - prev : 0;
    const changePercent =
      !isNaN(prev) && prev !== 0 ? (change / prev) * 100 : 0;

    const result = {
      id: "us10y",
      name: "10-Year Treasury Yield",
      symbol: "US10Y",
      price: parseFloat(latest.toFixed(4)),
      change: parseFloat(change.toFixed(4)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: 0,
      lastUpdated: obs?.[0]?.date || new Date().toISOString(),
      status: "fresh",
      source: "FRED",
    };

    cache = { payload: result, timestamp: Date.now() };

    return NextResponse.json(result, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error in US10Y API route:", error);
    return NextResponse.json(FALLBACK_US10Y, {
      headers: corsHeaders,
    });
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: corsHeaders,
  });
}
