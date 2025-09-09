import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.bitget.com/api/v2/spot/market/tickers', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; BitgetDashboard/1.0)'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bitget API error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
    }

    const data = await response.json();
    
    // Filter for the specific symbol
    const ticker = data.data.find((t: { symbol: string }) => t.symbol === symbol);
    if (!ticker) {
      return NextResponse.json(
        { error: `Symbol ${symbol} not found` },
        { status: 404 }
      );
    }
    
    // Return in the same format as the original API
    const filteredData = {
      ...data,
      data: [ticker]
    };
    
    return NextResponse.json(filteredData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error fetching ticker:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticker' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}