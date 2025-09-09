import { NextRequest, NextResponse } from 'next/server';

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
  throw new Error('All retry attempts failed');
}

export async function GET() {
  try {
    // Try multiple endpoints in case one is blocked
    const endpoints = [
      'https://api.bitget.com/api/v2/spot/public/symbols',
      'https://api.bitget.com/api/spot/v1/public/products',
    ];

    let lastError;

    for (const endpoint of endpoints) {
      try {
        const response = await fetchWithRetry(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; BitgetDashboard/1.0)',
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Normalize response format if needed
        const normalizedData = endpoint.includes('v1')
          ? { code: '00000', msg: 'success', data: data }
          : data;

        return NextResponse.json(normalizedData, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
          },
        });
      } catch (error) {
        console.error(`Error with endpoint ${endpoint}:`, error);
        lastError = error;
        continue;
      }
    }

    // If all endpoints fail, return mock data to keep the app functional
    console.warn('All API endpoints failed, returning mock data');
    const mockData = {
      code: '00000',
      msg: 'success (mock data)',
      data: [
        {
          symbol: 'BTCUSDT',
          baseCoin: 'BTC',
          quoteCoin: 'USDT',
          status: 'online',
        },
        {
          symbol: 'ETHUSDT',
          baseCoin: 'ETH',
          quoteCoin: 'USDT',
          status: 'online',
        },
        {
          symbol: 'ADAUSDT',
          baseCoin: 'ADA',
          quoteCoin: 'USDT',
          status: 'online',
        },
        {
          symbol: 'DOTUSDT',
          baseCoin: 'DOT',
          quoteCoin: 'USDT',
          status: 'online',
        },
        {
          symbol: 'LINKUSDT',
          baseCoin: 'LINK',
          quoteCoin: 'USDT',
          status: 'online',
        },
        {
          symbol: 'SOLUSDT',
          baseCoin: 'SOL',
          quoteCoin: 'USDT',
          status: 'online',
        },
        {
          symbol: 'MATICUSDT',
          baseCoin: 'MATIC',
          quoteCoin: 'USDT',
          status: 'online',
        },
        {
          symbol: 'AVAXUSDT',
          baseCoin: 'AVAX',
          quoteCoin: 'USDT',
          status: 'online',
        },
        {
          symbol: 'ATOMUSDT',
          baseCoin: 'ATOM',
          quoteCoin: 'USDT',
          status: 'online',
        },
        {
          symbol: 'NEARUSDT',
          baseCoin: 'NEAR',
          quoteCoin: 'USDT',
          status: 'online',
        },
      ],
    };

    return NextResponse.json(mockData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'X-Data-Source': 'mock',
      },
    });
  } catch (error) {
    console.error('Error fetching symbols:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch symbols',
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
