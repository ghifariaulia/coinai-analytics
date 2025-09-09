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
      limit: Math.min(parseInt(limit), 500).toString(), // API limit is 500
    });

    // Try multiple endpoints with retry logic
    const endpoints = [
      `https://api.bitget.com/api/v2/spot/market/orderbook?${params}`,
      `https://api.bitget.com/api/spot/v1/market/depth?${params}`,
    ];

    let lastError;

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; BitgetDashboard/1.0)',
            Accept: 'application/json',
          },
          signal: controller.signal,
          next: { revalidate: 1 }, // Cache for 1 second
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.code !== '00000') {
          throw new Error(`API error: ${data.msg || 'Unknown error'}`);
        }

        return NextResponse.json(data, {
          headers: {
            'Cache-Control': 'public, s-maxage=1, stale-while-revalidate=5',
          },
        });
      } catch (error) {
        console.error(`Error with endpoint ${endpoint}:`, error);
        lastError = error;
        continue;
      }
    }

    // If all endpoints fail, return mock orderbook data
    console.warn('All orderbook API endpoints failed, returning mock data');
    const mockOrderbook = {
      code: '00000',
      msg: 'success (mock data)',
      data: {
        asks: [
          ['50000.00', '0.1'],
          ['50100.00', '0.2'],
          ['50200.00', '0.15'],
        ],
        bids: [
          ['49900.00', '0.1'],
          ['49800.00', '0.2'],
          ['49700.00', '0.15'],
        ],
        ts: Date.now().toString(),
      },
    };

    return NextResponse.json(mockOrderbook, {
      headers: {
        'Cache-Control': 'public, s-maxage=1, stale-while-revalidate=5',
        'X-Data-Source': 'mock',
      },
    });
  } catch (error) {
    console.error('Error fetching orderbook data:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
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
