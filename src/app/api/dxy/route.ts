import { NextResponse } from 'next/server';

// Fallback data in case API fails
const FALLBACK_DXY = {
  id: 'dxy',
  name: 'US Dollar Index (DXY)',
  symbol: 'DXY',
  price: 104.50, // Example fallback value
  change: 0.10,
  changePercent: 0.10,
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
    return NextResponse.json(FALLBACK_DXY, { 
      headers: corsHeaders 
    });
  }

  try {
    // First, get the most recent DXY data point
    const response = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=DTWEXBGS9&api_key=${apiKey}&file_type=json&limit=2&sort_order=desc`,
      { 
        next: { revalidate: 300 }, // Cache for 5 minutes
        cache: 'no-store' // Ensure we don't cache errors
      }
    );
    
    if (!response.ok) {
      console.warn(`FRED API error: ${response.status} ${response.statusText}`);
      return NextResponse.json(FALLBACK_DXY, { 
        headers: corsHeaders 
      });
    }

    const data = await response.json();
    
    if (!data.observations || data.observations.length < 1) {
      console.warn('Insufficient data points from FRED API');
      return NextResponse.json(FALLBACK_DXY, { headers: corsHeaders });
    }
    
    const [latest, previous] = data.observations;
    const currentValue = parseFloat(latest.value);
    const previousValue = parseFloat(previous.value);
    const change = currentValue - previousValue;
    const changePercent = (change / previousValue) * 100;
    
    return NextResponse.json({
      id: 'dxy',
      name: 'US Dollar Index (DXY)',
      symbol: 'DXY',
      price: currentValue,
      change: parseFloat(change.toFixed(4)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: 0,
      lastUpdated: latest.date,
      status: 'fresh',
      source: 'FRED (DTWEXBGS9)'
    }, { 
      headers: corsHeaders 
    });
    
  } catch (error) {
    console.error('Error in DXY API route:', error);
    return NextResponse.json(FALLBACK_DXY, { 
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
