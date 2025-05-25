import { NextResponse } from 'next/server';

// Fallback data in case API fails
const FALLBACK_US10Y = {
  id: 'us10y',
  name: '10-Year Treasury Yield',
  symbol: 'US10Y',
  price: 4.25, // Example fallback value
  change: -0.02,
  changePercent: -0.47,
  volume: 0,
  lastUpdated: new Date().toISOString(),
  status: 'cached',
  source: 'fallback'
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET() {
  const apiKey = process.env.FRED_API_KEY || process.env.NEXT_PUBLIC_FRED_API_KEY;
  if (!apiKey) {
    console.warn('FRED_API_KEY is not configured, using fallback data');
    return NextResponse.json(FALLBACK_US10Y, { 
      headers: corsHeaders 
    });
  }

  try {
    // Fetch current value with a 5-minute cache
    const response = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${apiKey}&file_type=json&limit=2&sort_order=desc`,
      { 
        next: { revalidate: 300 }, // Cache for 5 minutes
        cache: 'no-store' // Ensure we don't cache errors
      }
    );

    if (!response.ok) {
      console.warn(`FRED API error: ${response.status} ${response.statusText}`);
      return NextResponse.json(FALLBACK_US10Y, { 
        headers: corsHeaders 
      });
    }

    const data = await response.json();
    
    if (!data.observations || data.observations.length < 2) {
      console.warn('Insufficient data points from FRED API');
      return NextResponse.json(FALLBACK_US10Y, { 
        headers: corsHeaders 
      });
    }
    
    const [latest, previous] = data.observations;
    const currentYield = parseFloat(latest.value);
    const previousYield = parseFloat(previous.value);
    
    if (isNaN(currentYield) || isNaN(previousYield)) {
      console.warn('Invalid yield data from FRED');
      return NextResponse.json(FALLBACK_US10Y, { 
        headers: corsHeaders 
      });
    }
    
    // Calculate change from previous day
    const change = currentYield - previousYield;
    const changePercent = previousYield !== 0 ? (change / previousYield) * 100 : 0;

    return NextResponse.json({
      id: 'us10y',
      name: '10-Year Treasury Yield',
      symbol: 'US10Y',
      price: currentYield,
      change: change,
      changePercent: changePercent,
      volume: 0,
      lastUpdated: new Date().toISOString(),
      status: 'fresh',
      source: 'FRED (via API)'
    }, { 
      headers: corsHeaders 
    });
    
  } catch (error) {
    console.error('Error in US10Y API route:', error);
    return NextResponse.json(FALLBACK_US10Y, { 
      headers: corsHeaders 
    });
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: corsHeaders
  });
}
