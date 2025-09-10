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
    // Try multiple endpoints for futures symbols
    const endpoints = [
      'https://api.bitget.com/api/v2/mix/market/contracts?productType=USDT-FUTURES',
      'https://api.bitget.com/api/mix/v1/market/contracts?productType=umcbl',
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

        // Normalize response format and map fields
        let normalizedData;
        if (endpoint.includes('v1')) {
          normalizedData = { code: '00000', msg: 'success', data: data };
        } else {
          // Map the API response to match our interface
          const mappedData =
            data.data?.map(
              (item: {
                symbol: string;
                baseCoin: string;
                quoteCoin: string;
                symbolStatus: string;
                symbolType: string;
                minTradeNum: string;
                priceEndStep: string;
                volumePlace: string;
                pricePlace: string;
              }) => ({
                symbol: item.symbol,
                baseCoin: item.baseCoin,
                quoteCoin: item.quoteCoin,
                status: item.symbolStatus, // Map symbolStatus to status
                contractType: item.symbolType,
                minTradeNum: item.minTradeNum,
                priceEndStep: item.priceEndStep,
                volumePlace: item.volumePlace,
                pricePlace: item.pricePlace,
              })
            ) || [];
          normalizedData = {
            code: data.code || '00000',
            msg: data.msg || 'success',
            data: mappedData,
          };
        }

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
          status: 'normal',
          contractType: 'perpetual',
          minTradeNum: '0.001',
          priceEndStep: '0.1',
          volumePlace: '3',
          pricePlace: '1',
        },
        {
          symbol: 'ETHUSDT',
          baseCoin: 'ETH',
          quoteCoin: 'USDT',
          status: 'normal',
          contractType: 'perpetual',
          minTradeNum: '0.01',
          priceEndStep: '0.01',
          volumePlace: '2',
          pricePlace: '2',
        },
        {
          symbol: 'ADAUSDT',
          baseCoin: 'ADA',
          quoteCoin: 'USDT',
          status: 'normal',
          contractType: 'perpetual',
          minTradeNum: '1',
          priceEndStep: '0.0001',
          volumePlace: '0',
          pricePlace: '4',
        },
        {
          symbol: 'SOLUSDT',
          baseCoin: 'SOL',
          quoteCoin: 'USDT',
          status: 'normal',
          contractType: 'perpetual',
          minTradeNum: '0.1',
          priceEndStep: '0.001',
          volumePlace: '1',
          pricePlace: '3',
        },
        {
          symbol: 'MATICUSDT',
          baseCoin: 'MATIC',
          quoteCoin: 'USDT',
          status: 'normal',
          contractType: 'perpetual',
          minTradeNum: '1',
          priceEndStep: '0.0001',
          volumePlace: '0',
          pricePlace: '4',
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
    console.error('Error fetching futures symbols:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch futures symbols',
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
