import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.FRED_API_KEY || process.env.NEXT_PUBLIC_FRED_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'FRED API key not configured' },
        { status: 500 }
      );
    }

    // Fetch current value
    const response = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${apiKey}&file_type=json&limit=2&sort_order=desc`
    );
    
    if (!response.ok) {
      throw new Error(`FRED API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.observations || data.observations.length === 0) {
      throw new Error('No data available from FRED');
    }

    const latest = data.observations[0];
    const currentYield = parseFloat(latest.value);
    
    // Calculate change from previous day if available
    let change = 0;
    let changePercent = 0;
    
    if (data.observations.length > 1) {
      const prevYield = parseFloat(data.observations[1].value);
      change = currentYield - prevYield;
      changePercent = (change / prevYield) * 100;
    }

    return NextResponse.json({
      id: 'us10y',
      name: '10-Year Treasury Yield',
      symbol: 'US10Y',
      price: currentYield,
      change: change,
      changePercent: changePercent,
      lastUpdated: new Date().toISOString(),
      status: 'fresh',
      source: 'FRED (via API)'
    });
    
  } catch (error) {
    console.error('Error in US10Y API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch US10Y data' },
      { status: 500 }
    );
  }
}
