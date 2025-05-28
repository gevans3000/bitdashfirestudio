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

// Helper function to fetch with retry
async function fetchWithRetry(url: string, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { 
        next: { revalidate: 300 },
        cache: 'no-store' // Ensure we don't get cached responses
      });
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed:`, error);
    }
    if (i < retries - 1) await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error(`Failed after ${retries} retries`);
}

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
  
  if (!apiKey) {
    console.warn('ALPHA_VANTAGE_API_KEY is not configured, using fallback data');
    return NextResponse.json(FALLBACK_US10Y, {
      headers: corsHeaders
    });
  }

  try {
    // Fetch 10-year treasury yield from Alpha Vantage
    const response = await fetchWithRetry(
      `https://www.alphavantage.co/query?function=TREASURY_YIELD&interval=daily&maturity=10year&apikey=${apiKey}`
    );

    // Parse the Alpha Vantage response
    const seriesData = response?.data || [];
    
    if (!Array.isArray(seriesData) || seriesData.length === 0) {
      console.warn('No data returned from Alpha Vantage API');
      return NextResponse.json(FALLBACK_US10Y, { 
        headers: corsHeaders 
      });
    }
    
    // Sort data by date in descending order
    const sortedData = [...seriesData].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Get the most recent data point
    const latestData = sortedData[0];
    const currentYield = parseFloat(latestData.value);
    
    if (isNaN(currentYield)) {
      console.warn('Invalid yield data from Alpha Vantage');
      return NextResponse.json(FALLBACK_US10Y, { 
        headers: corsHeaders 
      });
    }
    
    // Get previous day's close for change calculation
    let previousYield = currentYield * 0.99; // Default to 1% change if we can't get previous data
    
    if (sortedData.length > 1) {
      const prevYield = parseFloat(sortedData[1].value);
      if (!isNaN(prevYield)) {
        previousYield = prevYield;
      }
    }
    
    // Calculate change from previous day
    const change = currentYield - previousYield;
    const changePercent = previousYield !== 0 ? (change / previousYield) * 100 : 0;
    
    const result = {
      id: 'us10y',
      name: '10-Year Treasury Yield',
      symbol: 'US10Y',
      price: parseFloat(currentYield.toFixed(4)),
      change: parseFloat(change.toFixed(4)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: 0,
      lastUpdated: latestData.date || new Date().toISOString(),
      status: 'fresh',
      source: 'Alpha Vantage'
    };

    console.log('US10Y Data:', result); // Debug log
    
    return NextResponse.json(result, { 
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
