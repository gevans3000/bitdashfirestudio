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

// Helper function to fetch with retry
async function fetchWithRetry(url: string, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { next: { revalidate: 300 } });
      if (response.ok) return response.json();
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed:`, error);
    }
    if (i < retries - 1) await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error(`Failed after ${retries} retries`);
}

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_FMP_API_KEY;
  
  if (!apiKey) {
    console.warn('FMP_API_KEY is not configured, using fallback data');
    return NextResponse.json(FALLBACK_DXY, { 
      headers: corsHeaders 
    });
  }

  try {
    // Fetch DXY data from Financial Modeling Prep
    const response = await fetchWithRetry(
      `https://financialmodelingprep.com/api/v3/quote/DX-Y.NYB?apikey=${apiKey}`
    );
    
    if (!Array.isArray(response) || response.length === 0) {
      console.warn('No DXY data returned from FMP API');
      return NextResponse.json(FALLBACK_DXY, { headers: corsHeaders });
    }
    
    const dxyData = response[0];
    const currentValue = dxyData.price;
    const change = dxyData.change || 0;
    const changePercent = dxyData.changesPercentage || 0;
    
    if (isNaN(currentValue)) {
      console.warn('Invalid DXY data from FMP');
      return NextResponse.json(FALLBACK_DXY, { headers: corsHeaders });
    }
    
    return NextResponse.json({
      id: 'dxy',
      name: 'US Dollar Index (DXY)',
      symbol: 'DXY',
      price: parseFloat(currentValue.toFixed(4)),
      change: parseFloat(change.toFixed(4)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: dxyData.volume || 0,
      lastUpdated: new Date().toISOString(),
      status: 'fresh',
      source: 'Financial Modeling Prep'
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
