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
  const apiKey = process.env.FRED_API_KEY;
  
  if (!apiKey) {
    console.warn('FRED_API_KEY is not configured, using fallback data');
    return NextResponse.json(FALLBACK_DXY, { 
      headers: corsHeaders 
    });
  }

  try {
    const response = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=DTWEX&api_key=${apiKey}&file_type=json&limit=2&sort_order=desc`,
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
    
    if (!data.observations?.length) {
      console.warn('No data available from FRED');
      return NextResponse.json(FALLBACK_DXY, { 
        headers: corsHeaders 
      });
    }

    const latest = data.observations[0];
    const currentPrice = parseFloat(latest.value);
    
    if (isNaN(currentPrice)) {
      console.warn('Invalid price data from FRED');
      return NextResponse.json(FALLBACK_DXY, { 
        headers: corsHeaders 
      });
    }
    
    // Calculate change from previous day if available
    let change = 0;
    let changePercent = 0;
    
    if (data.observations.length > 1) {
      const prevPrice = parseFloat(data.observations[1].value);
      if (!isNaN(prevPrice) && prevPrice !== 0) {
        change = currentPrice - prevPrice;
        changePercent = (change / prevPrice) * 100;
      }
    }

    return NextResponse.json({
      id: 'dxy',
      name: 'US Dollar Index (DXY)',
      symbol: 'DXY',
      price: currentPrice,
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
