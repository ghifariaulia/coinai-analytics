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
    // Try multiple endpoints for futures tickers
    const endpoints = [
      'https://api.bitget.com/api/v2/mix/market/tickers?productType=USDT-FUTURES',
      'https://api.bitget.com/api/mix/v1/market/tickers?productType=umcbl',
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
            'Cache-Control': 'public, max-age=60', // Cache for 1 minute
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
          lastPr: '45000.00',
          high24h: '46000.00',
          low24h: '44000.00',
          change24h: '1000.00',
          changeUtc24h: '2.27',
          baseVol: '1234.567',
          quoteVol: '55555555.00',
          usdtVol: '55555555.00',
          ts: Date.now().toString(),
          buyOne: '44999.50',
          sellOne: '45000.50',
          bidSz: '0.123',
          askSz: '0.456',
          openUtc: '44000.00',
        },
        {
          symbol: 'ETHUSDT',
          lastPr: '3200.00',
          high24h: '3300.00',
          low24h: '3100.00',
          change24h: '100.00',
          changeUtc24h: '3.23',
          baseVol: '2345.678',
          quoteVol: '7500000.00',
          usdtVol: '7500000.00',
          ts: Date.now().toString(),
          buyOne: '3199.50',
          sellOne: '3200.50',
          bidSz: '1.234',
          askSz: '2.345',
          openUtc: '3100.00',
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
    console.error('Error fetching futures tickers:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch futures tickers',
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
