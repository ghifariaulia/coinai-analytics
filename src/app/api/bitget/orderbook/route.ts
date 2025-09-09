import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const limit = searchParams.get('limit') || '100';

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // Build query parameters for Bitget API
    const params = new URLSearchParams({
      symbol,
      limit: Math.min(parseInt(limit), 500).toString() // API limit is 500
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`https://api.bitget.com/api/v2/spot/market/orderbook?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; BitgetDashboard/1.0)'
      },
      signal: controller.signal,
      next: { revalidate: 1 } // Cache for 1 second
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Bitget API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Bitget API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (data.code !== '00000') {
      console.error('Bitget API returned error:', data);
      return NextResponse.json(
        { error: `Bitget API error: ${data.msg || 'Unknown error'}` },
        { status: 400 }
      );
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=1, stale-while-revalidate=5'
      }
    });
  } catch (error) {
    console.error('Error fetching orderbook data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}