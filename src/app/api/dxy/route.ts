import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.FRED_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'FRED API key not configured' },
        { status: 500 }
      );
    }

    // Fetch current value - Using ICE DXY index (DXY)
    const response = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=DTWEX&api_key=${apiKey}&file_type=json&limit=2&sort_order=desc`
    );
    
    if (!response.ok) {
      throw new Error(`FRED API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.observations || data.observations.length === 0) {
      throw new Error('No data available from FRED');
    }

    const latest = data.observations[0];
    const currentPrice = parseFloat(latest.value);
    
    // Calculate change from previous day if available
    let change = 0;
    let changePercent = 0;
    
    if (data.observations.length > 1) {
      const prevPrice = parseFloat(data.observations[1].value);
      change = currentPrice - prevPrice;
      changePercent = (change / prevPrice) * 100;
    }

    return NextResponse.json({
      id: 'dxy',
      name: 'US Dollar Index (DXY)',
      symbol: 'DXY',
      price: currentPrice,
      change: change,
      changePercent: changePercent,
      volume: 0, // FRED doesn't provide volume
      lastUpdated: new Date().toISOString(),
      status: 'fresh'
    });
    
  } catch (error) {
    console.error('Error in DXY API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DXY data' },
      { status: 500 }
    );
  }
}
